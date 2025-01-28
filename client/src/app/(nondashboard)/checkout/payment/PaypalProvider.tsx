import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import {
  Appearance,
  loadStripe,
  StripeElementsOptions,
} from "@stripe/stripe-js";
import { useCreatePaypalPaymentIntentMutation } from "@/state/api";
import { useCurrentCourse } from "@/hooks/useCurrentCourse";
import Loading from "@/components/Loading";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set");
}

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// const appearance: Appearance = {
//   theme: "stripe",
//   variables: {
//     colorPrimary: "#0570de",
//     colorBackground: "#18181b",
//     colorText: "#d2d2d2",
//     colorDanger: "#df1b41",
//     colorTextPlaceholder: "#6e6e6e",
//     fontFamily: "Inter, system-ui, sans-serif",
//     spacingUnit: "3px",
//     borderRadius: "10px",
//     fontSizeBase: "14px",
//   },
// };

const PaypalProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderID, setOrderID] = useState<string | "">("");
  const [createPaypalPaymentIntent] = useCreatePaypalPaymentIntentMutation();
  const { course } = useCurrentCourse();
  const [{ isPending }] = usePayPalScriptReducer();

  useEffect(() => {
    if (!course) return;
    const fetchPaymentIntent = async () => {
      const result = await createPaypalPaymentIntent({
        amount: course?.price ?? 9999999999999,
      }).unwrap();

      const orderDetail = result.orderDetail;

      if (orderDetail.id) {
        return orderDetail.id;
      }

      setOrderID(orderDetail.id);
    };

    fetchPaymentIntent();
  }, [createPaypalPaymentIntent, course?.price, course]);

  // const options: StripeElementsOptions = {
  //   clientSecret,
  //   appearance,
  // };

  // if (!clientSecret) return <Loading />;

  if (isPending) return <Loading />;

  return (
    //<Elements stripe={stripePromise} options={options} key={clientSecret}>
    { children }
    //</Elements>
  );
};

export default PaypalProvider;
