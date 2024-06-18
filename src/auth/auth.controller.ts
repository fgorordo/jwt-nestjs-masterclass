import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AccessTokenGuard, RefreshTokenGuard } from 'src/common/guards';
import { GetCurrentUser, Public } from 'src/common/decorators';

@Controller('auth')
export class AuthController {

    constructor( private authService: AuthService ) {}

    @Public()
    @Post("/local/signup")
    @HttpCode(HttpStatus.CREATED)
    signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signupLocal(dto);
    }

    @Public()
    @Post("/local/signin")
    @HttpCode(HttpStatus.OK)
    signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signinLocal(dto);
    }

    @Post("/logout")
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrentUser('sub') id: number) {
        return this.authService.logout(id);
    }

    @Public()
    @UseGuards(RefreshTokenGuard)
    @Post("/refresh")
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUser('refreshToken') refreshToken: string,
        @GetCurrentUser('sub') id: number,
    ) {
        return this.authService.refreshTokens(id, refreshToken);
    }

}
