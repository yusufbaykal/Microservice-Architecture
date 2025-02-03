import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/config';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password,role} = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    const user = new User({username,email,password,role});

    await user.save();

    return res.status(201).json({
      message: 'User successfully created',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Successful entry',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Serve Error', error });
  }
}; 