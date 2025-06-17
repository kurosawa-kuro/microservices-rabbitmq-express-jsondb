import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

interface Order {
    id: number;
    userId: number;
    productId: number;
    quantity: number;
    status: string;
    createdAt: string;
}

class OrderRepository {
    private db: lowdb.LowdbSync<any>;

    constructor() {
        const adapter = new FileSync('db.json');
        this.db = lowdb(adapter);
    }

    GetOrder = async (data: { id: string }) => {
        const orders = this.db.get('orders').value() as Order[];
        return orders.find(order => order.id === parseInt(data.id));
    }
    
    GetOrders = async () => {
        return this.db.get('orders').value();
    }
}

export default OrderRepository;