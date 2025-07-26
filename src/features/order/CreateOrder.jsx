import { useState, useMemo } from 'react';
import { Form, redirect, useActionData, useNavigation } from 'react-router-dom';
import { createOrder } from '../../services/apiRestaurant';
import Button from '../../ui/Button';
import EmptyCart from '../cart/EmptyCart';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, getCart, getTotalCartPrice } from '../cart/cartSlice';
import store from '../../store';
import { formatCurrency } from '../../utils/helpers';
import { fetchAddress } from '../user/userSlice';

// ✅ Phone validation regex
const PHONE_REGEX = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

const isValidPhone = (str) => PHONE_REGEX.test(str);

function CreateOrder() {
  const [withPriority, setWithPriority] = useState(false);
  const {
    username,
    status: addressStatus,
    position,
    address,
    error: errorAddress,
  } = useSelector((state) => state.user);

  const isLoadingAddress = addressStatus === 'loading';
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const formErrors = useActionData();
  const dispatch = useDispatch();

  const cart = useSelector(getCart);
  const totalCartPrice = useSelector(getTotalCartPrice);

  const totalPrice = useMemo(() => {
    const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0;
    return totalCartPrice + priorityPrice;
  }, [withPriority, totalCartPrice]);

  if (!cart.length) return <EmptyCart />;

  return (
    <div className="px-4 py-6">
      <h2 className="mb-8 text-xl font-semibold">Ready to order? Let's go!</h2>

      <Form method="POST" aria-label="Create order form">
        {/* Customer Name */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="customer">
            First Name
          </label>
          <input
            className="input grow"
            type="text"
            id="customer"
            name="customer"
            defaultValue={username}
            required
          />
        </div>

        {/* Phone Number */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="phone">
            Phone number
          </label>
          <div className="grow">
            <input
              className="input w-full"
              type="tel"
              id="phone"
              name="phone"
              required
              aria-invalid={!!formErrors?.phone}
            />
            {formErrors?.phone && (
              <p
                className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-700"
                role="alert"
              >
                {formErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="address">
            Address
          </label>
          <div className="grow">
            <input
              className="input w-full"
              type="text"
              id="address"
              name="address"
              disabled={isLoadingAddress}
              defaultValue={address}
              required
            />
            {addressStatus === 'error' && (
              <p
                className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-700"
                role="alert"
              >
                {errorAddress}
              </p>
            )}
          </div>

          {/* Get Position Button */}
          {!position.latitude && !position.longitude && (
            <span className="absolute right-1 top-1 md:right-2 md:top-2">
              <Button
                disabled={isLoadingAddress}
                type="small"
                onClick={(e) => {
                  e.preventDefault();
                  dispatch(fetchAddress());
                }}
              >
                {isLoadingAddress ? 'Fetching...' : 'Get position'}
              </Button>
            </span>
          )}
        </div>

        {/* Priority Checkbox */}
        <div className="mb-12 flex items-center gap-5">
          <input
            className="h-6 w-6 accent-yellow-400 focus:outline-none focus:ring focus:ring-yellow-400 focus:ring-offset-2"
            type="checkbox"
            name="priority"
            id="priority"
            checked={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />
          <label htmlFor="priority" className="font-medium">
            Want to give your order priority?
          </label>
        </div>

        {/* Hidden Fields */}
        <input type="hidden" name="cart" value={JSON.stringify(cart)} />
        <input
          type="hidden"
          name="position"
          value={
            position.latitude && position.longitude
              ? `${position.latitude},${position.longitude}`
              : ''
          }
        />

        {/* Submit Button */}
        <Button disabled={isSubmitting || isLoadingAddress} type="primary">
          {isSubmitting
            ? 'Placing order...'
            : `Order now from ${formatCurrency(totalPrice)}`}
        </Button>
      </Form>
    </div>
  );
}

// ✅ Action Function
export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const order = {
    ...data,
    cart: JSON.parse(data.cart),
    priority: data.priority === 'true',
  };

  const errors = {};
  if (!isValidPhone(order.phone)) {
    errors.phone =
      'Please provide a valid phone number. We might need it to contact you.';
  }

  if (Object.keys(errors).length > 0) return errors;

  // ✅ Create new order
  const newOrder = await createOrder(order);

  // ✅ Clear cart after successful order
  store.dispatch(clearCart());

  return redirect(`/order/${newOrder.id}`);
}

export default CreateOrder;
