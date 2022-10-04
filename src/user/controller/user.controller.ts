import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { User } from '../models/user.interface';
import { UserService } from '../service/user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService){}

    // create user 
    @Post()
    create(@Body() user: User): Observable<User>{
        return this.userService.create(user);
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
}
