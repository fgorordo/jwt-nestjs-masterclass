import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from "bcrypt";
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signupLocal(dto: AuthDto): Promise<Tokens> {
        const hash = await this.hashData(dto.password);
        const candidate = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hash,
            }
        })

        const tokens = await this.getTokens(candidate.id, candidate.email)
        await this.updateRefreshTokenHash(candidate.id, tokens.refresh_token)
        return tokens;
    }

    async signinLocal(dto: AuthDto): Promise<Tokens> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new ForbiddenException("Credenciales incorrectas, intenta de nuevo por favor.")

        const hashMatches = await bcrypt.compare(dto.password, user.password);
        if (!hashMatches) throw new ForbiddenException("Credenciales incorrectas, intenta de nuevo por favor.")

        const tokens = await this.getTokens(user.id, user.email)
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token)
        return tokens;

    }


    async logout(id: number) {
        await this.prisma.user.updateMany({
            where: { id, refresh_token_hash: { not: null } },
            data: { refresh_token_hash: null }
        })
    }

    async refreshTokens(id: number, refreshToken: string) {
        const user = await this.prisma.user.findUnique({ where: { id } })
        if (!user || !user.refresh_token_hash) throw new ForbiddenException("Acceso denegado");

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refresh_token_hash);
        if (!refreshTokenMatches) throw new ForbiddenException("Acceso denegado");

        const tokens = await this.getTokens(user.id, user.email)
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token)
        return tokens;
    }

    async updateRefreshTokenHash(id: number, refreshToken: string) {
        const hash = await this.hashData(refreshToken);
        await this.prisma.user.update({
            where: { id },
            data: { refresh_token_hash: hash }
        });
    }

    private hashData(data: string) {
        return bcrypt.hash(data, 10)
    }

    private async getTokens(id: number, email: string): Promise<Tokens> {
        const [accesToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: id, email }, { expiresIn: 60 * 15, secret: 'at-secret' }),
            this.jwtService.signAsync({ sub: id, email }, { expiresIn: 60 * 60 * 24 * 7, secret: 'rt-secret' }),
        ])

        return {
            access_token: accesToken,
            refresh_token: refreshToken,
        };
    }
}
