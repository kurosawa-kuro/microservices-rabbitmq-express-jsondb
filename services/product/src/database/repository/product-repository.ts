import dbConnection from '../connection';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    createdAt: string;
}

class ProductRepository {
    private db = dbConnection;

    GetProduct = async (data:{id:string}) => {
        const products = this.db.get('products').value() as Product[];
        return products.find(product => product.id === parseInt(data.id));
    }
    
    GetProducts = async () => {
        return this.db.get('products').value();
    }
}

export default ProductRepository;