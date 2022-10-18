import { Injectable, Options } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, from, map, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../auth/service/auth.service';
import { Like, Repository } from 'typeorm';
import { UserEntity } from '../models/user.entity';
import { User, UserRole } from '../models/user.interface';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private authService: AuthService
    ) { }

    // create user 
    create(user: User): Observable<User> {
        return this.authService.hashPassword(user.password).pipe(
            switchMap((passwordHash: string) => {
                const newUser = new UserEntity();

                newUser.name = user.name;
                newUser.username = user.username;
                newUser.email = user.email;
                newUser.password = passwordHash;
                newUser.role = UserRole.USER;

                return from(this.userRepository.save(newUser)).pipe(map((user: User) => {
                    const { password, ...result } = user;

                    return result;
                }),
                    catchError(err => throwError(err))
                )
            })
        )
    }

    // find user 
    findOne(id: number): Observable<User> {
        return from(this.userRepository.findOne({
            where: { id: id }
        })).pipe(map((user: User) => {
            const { password, ...result } = user;

            return result;
        }))
    }

    // find all user 
    findAll(): Observable<User[]> {
        return from(this.userRepository.find()).pipe(
            map((users: User[]) => {
                users.forEach((v) => delete (v.password));

                return users;
            })
        )
    }

    // get all user via pagination
    paginate(options: IPaginationOptions): Observable<Pagination<User>> {
        return from(paginate<User>(this.userRepository, options)).pipe(map((usersPageable: Pagination<User>) => {
            usersPageable.items.forEach(function (v) { delete v.password })

            return usersPageable;
        }))
    }

    // filter result by username 
    paginateFilterByUsername(options: IPaginationOptions, user: User): Observable<Pagination<User>> {
        return from(this.userRepository.findAndCount({
            // skip: Number(options.page) * Number(options.limit) || 0,
            take: Number(options.limit) || 10,
            order: { id: "ASC" },
            select: ['id', 'name', 'username', 'email', 'role'],
            where: [
                { username: Like(`%${user.username}%`) }
            ]
        })).pipe(
            map(([users, totalUsers]) => {
                const usersPageable: Pagination<User> = {
                    items: users,
                    links: {
                        first: options.route + `?limit=${options.limit}`,
                        previous: options.route + ``,
                        next: options.route + `?limit=${options.limit}&page=${Number(options.page) + 1}`,
                        last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / Number(options.limit))}`,
                    },
                    meta: {
                        currentPage: +options.page,
                        itemCount: users.length,
                        itemsPerPage: +options.limit,
                        totalItems: totalUsers,
                        totalPages: Math.ceil(totalUsers / Number(options.limit))
                    }
                }

                return usersPageable;
            })
        )
    }


    // delete user
    deleteOne(id: number): Observable<any> {
        return from(this.userRepository.delete(id));
    }

    // update user 
    updateOne(id: number, user: User): Observable<any> {
        delete user.email;
        delete user.password;
        delete user.role;

        return from(this.userRepository.update(id, user)).pipe(
            switchMap(() => this.findOne(id))
        )   
    }


    // user login 
    login(user: User): Observable<string> {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => {
                if (user) {
                    return this.authService.generateJWT(user).pipe(map((jwt: string) => jwt));
                } else {
                    return 'wrong credentials';
                }
            })
        )
    }

    // validate user 
    validateUser(email: string, password: string): Observable<User> {
        return this.findByMail(email).pipe(
            switchMap((user: User) => this.authService.comparePasswords(password, user.password).pipe(
                map((match: boolean) => {
                    if (match) {
                        const { password, ...result } = user;
                        return result;
                    } else {
                        throw Error;
                    }
                })
            ))
        )
    }

    // find user by email
    findByMail(email: string): Observable<User> {
        return from(this.userRepository.findOne({ where: { email: email } }))
    }

    // update role of user 
    updateRoleOfUser(id: number, user: User): Observable<any> {
        return from(this.userRepository.update(id, user))
    }
}