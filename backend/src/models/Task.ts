import { Model, DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

export class Task extends Model {
  declare id: number;
  declare user_id: number;
  declare title: string;
  declare description: string | null;
  declare status: string;
  declare priority: string;
  declare due_date: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed'), defaultValue: 'pending' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    due_date: { type: DataTypes.DATE, allowNull: true },
  },
  { 
    sequelize, 
    tableName: 'tasks', 
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Task.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Task, { foreignKey: 'user_id' });
