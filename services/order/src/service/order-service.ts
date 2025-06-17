import OrderRepository from '../database/repository/order-repository';

class OrderService {

    repository:OrderRepository;

    constructor() {
        this.repository = new OrderRepository();
    }

    GetOrderList = async () => {
        const orderList = await this.repository.GetOrders();
        return orderList;
    }
    
    GetOrder = async (data: { id: string }) => {
        const order = await this.repository.GetOrder(data);
        return order;
    }

    ReceivePing = async (data:any) => {
        console.log('Your service just got pinged:');
        console.log(data);
    }

    HandlePayload = async (payload:any) => {
        const {event, data} = JSON.parse(payload);
        console.log(event);
        switch(event) {
            case 'PING':
                this.ReceivePing(data);
                break;
            default:
                break;
        }
    }
}

export default OrderService;