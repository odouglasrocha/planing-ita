// Tipos compartilhados para autenticação MongoDB
export interface MongoUser {
  _id?: string;
  id?: string;
  email: string;
  password?: string;
  name: string;
  full_name?: string;
  role: 'admin' | 'supervisor' | 'operador';
  department?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthSession {
  id?: string;
  user: MongoUser;
  token: string;
  expires_at: string | Date;
}