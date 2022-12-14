import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors, Request, Res } from '@nestjs/common';
import { catchError, from, map, Observable, of } from 'rxjs';
import { hasRoles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-guard';
import { User, UserRole } from '../models/user.interface';
import { UserService } from '../service/user.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { join } from 'path';


export const storage = {
        storage: diskStorage({
            destination: './uploads/profileimages',
            filename: (req, file, cb) =>  {
                let date = new Date();
                let time = date.getTime();
                const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + time;
                const extension: string = path.parse(file.originalname).ext;

                cb(null, `${filename}${extension}`);
            }
        })
}

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
    index(
        @Query('page') page: number = 1, 
        @Query('limit') limit: number = 10,
        @Query('username') username: string
        ): Observable<Pagination<User>>{
        limit = limit > 100 ? 100 : limit;

        if(username === null || username === undefined){
            return this.userService.paginate({page: Number(page), limit: Number(limit), route: 'http://localhost:3000/users'});
        } else {
            return this.userService.paginateFilterByUsername({page: Number(page), limit: Number(limit), route: 'http://localhost:3000/users'}, {username});
        }

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


    // upload user profile imagge 
    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req): Observable<Object> {
        const user: User = req.user.user;
        console.log(user);

        return this.userService.updateOne(user.id, {profileImage: file.filename}).pipe(
            map((user: User) => ({profileImage: user.profileImage}))
        )
    }


    // get user profile image
    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
        return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)))
    }
}