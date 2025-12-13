import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core'; 
import { AuthModule } from 'src/app/resources/auth/auth.module';
import { AdminModule } from './resources/admin/admin.module';

@Module({
  imports: [
    RouterModule.register([
       {
    path: 'admin',
    module: AdminModule,
  },
  {
    path: 'auth',
    module: AuthModule,
  },
    ]),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}