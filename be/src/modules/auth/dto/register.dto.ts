import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

// Người dùng tự đăng ký không được chọn role / isActive
export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'password',
  'fullName',
] as const) {}
