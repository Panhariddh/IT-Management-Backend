import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core'; 
import { AuthModule } from 'src/app/resources/shared/modules/auth.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'auth',
        module: AuthModule,
      },
      // Add more feature modules here:
      // {
      //   path: 'api/users',
      //   module: UserModule,
      // },
    ]),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}