import dbConnection from '../connection';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

class UserRepository {
    private db = dbConnection;

    GetUser = async (data:{id:string}) => {
        const users = this.db.get('users').value() as User[];
        return users.find(user => user.id === parseInt(data.id));
    }
    
    GetUsers = async () => {
        return this.db.get('users').value();
    }
}

export default UserRepository;