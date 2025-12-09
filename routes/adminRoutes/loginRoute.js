import express from 'express';
import bcrypt from 'bcrypt';
import { PlayerRole } from '../../utility/enums.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import prisma  from '../../prisma/db.js';
import { generateToken } from '../../utility/tokenAuthService.js';
import { validators } from '../../middleware/validateResource/index.js';

const router = express.Router();

// async function generateHashedPassword(plainTextPassword: string) {
//   const saltRounds = 11; // same as `$2a$11$` in your previous example
//   const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
//   console.log('Hashed Password:', hashedPassword);
//   return hashedPassword;
// }

// Admin Roles enum player: ['super_admin', 'admin', 'manager', 'partner']

router.post('/login', async (req, res) => {
  const { email, password, otp } = req.body;
  const ip1 = Array.isArray(req.headers['cf-connecting-ip'])
  ? req.headers['cf-connecting-ip'][0]
  : req.headers['cf-connecting-ip'] || req.ip;
 const ip2 = Array.isArray(req.headers['x-forwarded-for'])
  ? req.headers['x-forwarded-for'][0]
  : req.headers['x-forwarded-for'] || req.ip;


  try {
    
    const admin = await prisma.admins.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ message: 'Invalid email address' });
  
    const validPassword = await bcrypt.compare(password, admin.encrypted_password);
    
    if (!validPassword) return res.status(401).json({ message: 'Invalid password' });

    if (!admin.qr || !admin.keypass) {
      const secret = speakeasy.generateSecret({ name: 'BOM Admin' });
      if (!secret.otpauth_url) {
        return res.status(500).json({ message: 'Pass key URL generation failed' });
      }

      const qrImage = await qrcode.toDataURL(secret.otpauth_url);

      // Temporary step — frontend should now prompt for OTP and call /setup-2fa
      return res.status(200).json({
        setup: true,
        qr: qrImage,
        secret: secret.base32,
        message: 'Scan QR and confirm Pass key to complete setup',
      });
    }

    const otpVerified = speakeasy.totp.verify({
      secret: admin.keypass,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!otpVerified) return res.status(401).json({ message: 'Invalid pass key' });

    await prisma.admin_login_logs.create({
      data: {
        admin_id: admin.id,
        ip_address: ip1,
        ip_address_2: ip2,
        login_time: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const payload = {
      id: Number(admin.id),
      email: admin.email,
      player:admin.player,
      ...(admin.player != null && {
        role: PlayerRole[admin.player]
      })
    }

    const token = await generateToken({...payload});
    return res.status(200).json({ message: 'Login successful',  "token":token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// One-time endpoint to store OTP key after QR is scanned
router.post('/setup-2fa',  validators('SETUP_2FA'), async (req, res) => {
  const { email, otp, secret } = req.body;

  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!verified) return res.status(401).json({ message: 'Invalid OTP' });

    const updatedAdmin = await prisma.admins.update({
      where: { email },
      data: {
        keypass: secret,
        qr: true,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        player: true
      }
    });

    
    const payload = {
      id: Number(updatedAdmin.id),
      email: updatedAdmin.email,
      player: updatedAdmin.player,
      ...(updatedAdmin.player != null && {
        role: PlayerRole[updatedAdmin.player]
      })
    };

    const token = await generateToken(payload);
    return res.json({ "token": token, message: '2FA setup complete' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
