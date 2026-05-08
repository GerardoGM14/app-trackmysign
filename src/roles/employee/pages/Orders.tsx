import OrdersPage from '../../../features/orders/OrdersPage';

const ME = 'Anna Schmidt'; // Mock current employee — comes from auth in production

export default function EmployeeOrders() {
    return <OrdersPage currentEmployee={ME} />;
}
