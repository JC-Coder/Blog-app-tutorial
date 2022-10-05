import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { catchError, from, map, Observable, of } from 'rxjs';
import { hasRoles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-guard';
import { User, UserRole } from '../models/user.interface';
import { UserService } from '../service/user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService){}

    // create user 
    @Post()
    create(@Body() user: User): Observable<User | object>{
        return this.userService.create(user).pipe(
            map((user: User) => user), 
            catchError(err => of({error: err.message}))
        )
    }

    // user login 
    @Post('login')
    login(@Body() user: User): Observable<Object>{
        return this.userService.login(user).pipe(
            map((jwt: string) => {
                return {access_token: jwt};
            })
        )
    }


    // find user 
    @Get(':id')
    findOne(@Param() params): Observable<User>{
        return this.userService.findOne(params.id);
    }

    // find all users
    @Get()
    findall(): Observable<User[]>{
        return this.userService.findAll();
    }

    // delete user
    @Delete(':id')
    deleteOne(@Param('id') id: string): Observable<any>{
        return this.userService.deleteOne(Number(id))
    }

    // update user
    @Put(':id')
    updateOne(@Param('id') id: string, @Body() user: User): Observable<any>{
        return this.userService.updateOne(Number(id),user);
    }

    // change user role
    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: string, @Body() user: User): Observable<User | object>{
        return this.userService.updateRoleOfUser(Number(id), user).pipe(
            map((user: User) => user),
            catchError((err) => of({error: err.message}))
        )
    }
}
