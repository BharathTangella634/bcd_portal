import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Hospital } from '../entities/Hospital';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { hospitalCode, username, password, role } = req.body;

    try {
      const hospitalRepo = AppDataSource.getRepository(Hospital);
      const hospital = await hospitalRepo.findOneBy({ code: hospitalCode });

      if (!hospital) {
        return res.status(401).json({ message: 'Invalid hospital code' });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: {
          hospital_id: hospital.id,
          username,
          role,
        },
        select: ['id', 'username', 'password_hash', 'role', 'hospital_id'],
      });

      if (!user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const secret = process.env.JWT_SECRET || 'secret';
      const token = jwt.sign(
        { userId: user.id, hospitalId: user.hospital_id, role: user.role },
        secret,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          hospitalId: user.hospital_id,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: req.user.id });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        hospitalId: user.hospital_id,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
