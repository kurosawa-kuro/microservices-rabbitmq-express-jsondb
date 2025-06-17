import dbConnection from '../connection';

interface Client {
    id: number;
    name: string;
    email: string;
    type: string;
    address: string;
    phone: string;
    createdAt: string;
}

class ClientRepository {
    private db = dbConnection;

    GetClient = async (data:{id:string}) => {
        const clients = this.db.get('clients').value() as Client[];
        return clients.find(client => client.id === parseInt(data.id));
    }
    
    GetClients = async () => {
        return this.db.get('clients').value();
    }
}

export default ClientRepository;