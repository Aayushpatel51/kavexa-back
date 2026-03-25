import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/loginUser.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private readonly userService: UserService, private jwtService: JwtService) {}

    async registerUser(registerUserDto: RegisterUserDto) {
        // Implementation for user registration logic
        /**
         * 1. check if the user already exists
         * 2. validate the user input    
         * 3. hash the password
         * 4. save the user to the database
         * 5. generate a JWT token for the user
         * 6. return the token and user information
         */        
        const saltRounds = 10;
        const existingUser = await this.userService.getUserByEmail(registerUserDto.email);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(registerUserDto.password, saltRounds);
        const newUser = await this.userService.createUser({...registerUserDto, password: hashedPassword });        
        this.logger.log(`User registered successfully: ${newUser.id}`);
        const payload = { email: newUser.email, sub: newUser.id };
        const token = await this.jwtService.signAsync(payload);

        return { ...newUser, token };
    }

    async loginUser(loginDto: LoginUserDto) {
        // Implementation for user login logic
        /**
         * 1. check if the user exists
         * 2. validate the user input
         * 3. compare the password with the hashed password in the database
         * 4. generate a JWT token for the user
         * 5. return the token and user information
         */
        const user = await this.userService.getUserByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await bcrypt.compare(loginDto.password, user.password).then(isMatch => {
            if (!isMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }
        });

        this.logger.log(`User logged in successfully: ${user.id}`);
        const payload = { email: user.email, sub: user.id };
        const token = await this.jwtService.signAsync(payload);

        return { ...user, token };
    }
}
