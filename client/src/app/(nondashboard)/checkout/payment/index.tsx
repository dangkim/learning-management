import React, { useState, JSX } from "react";
import {
  PayPalScriptProvider,
  usePayPalCardFields,
  PayPalCardFieldsProvider,
  PayPalCardFieldsForm,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import type {
  CreateOrderActions,
  OnApproveData,
  OnApproveActions,
  CardFieldsOnApproveData,
} from "@paypal/paypal-js";
import CoursePreview from "@/components/CoursePreview";
import {
  useCreatePaypalPaymentIntentMutation,
  useCreateTransactionMutation,
} from "@/state/api";
import { useCheckoutNavigation } from "@/hooks/useCheckoutNavigation";
import { useCurrentCourse } from "@/hooks/useCurrentCourse";
import { useClerk, useUser } from "@clerk/nextjs";
import { centsToDollars } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BillingAddress {
  addressLine1: string;
  addressLine2: string;
  adminArea1: string;
  adminArea2: string;
  countryCode: string;
  postalCode: string;
}

interface SubmitPaymentProps {
  isPaying: boolean;
  setIsPaying: React.Dispatch<React.SetStateAction<boolean>>;
  billingAddress: BillingAddress;
}

const PaymentPageContent = () => {
  const [isPaying, setIsPaying] = useState(false);
  const [createTransaction] = useCreateTransactionMutation();
  const [createPaypalPaymentIntent] = useCreatePaypalPaymentIntentMutation();
  const { navigateToStep } = useCheckoutNavigation();
  const { course, courseId } = useCurrentCourse();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [{ isPending }] = usePayPalScriptReducer();

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    addressLine1: "",
    addressLine2: "",
    adminArea1: "",
    adminArea2: "",
    countryCode: "",
    postalCode: "",
  });

  function handleBillingAddressChange(
    field: keyof BillingAddress,
    value: string
  ): void {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function createOrder(): Promise<string> {
    try {
      const result = await createPaypalPaymentIntent({
        amount: course?.price ?? 9999999999999,
      }).unwrap();
      console.log("Order created:", result.orderDetail.id);
      return result.orderDetail.id;
    } catch (err) {
      console.error(err);
    }

    return "";
  }

  async function captureOrder(): Promise<void> {
    try {
      const result = await createPaypalPaymentIntent({
        amount: course?.price ?? 9999999999999,
      }).unwrap();
      alert("Payment successful!");
      console.log("Order captured:", result.orderDetail.id);
    } catch (err) {
      console.error(err);
    }
  }

  function onError(error: Record<string, unknown>): void {
    console.error("Payment error:", error);
  }

  const handleSignOutAndNavigate = async () => {
    await signOut();
    navigateToStep(1);
  };

  const SubmitPayment: React.FC<SubmitPaymentProps> = ({
    isPaying,
    setIsPaying,
    billingAddress,
  }) => {
    const { cardFieldsForm } = usePayPalCardFields();

    const handleClick = async (): Promise<void> => {
      if (!cardFieldsForm) {
        throw new Error(
          "Unable to find any child components in the <PayPalCardFieldsProvider />"
        );
      }

      const formState = await cardFieldsForm.getState();

      if (!formState.isFormValid) {
        alert("The payment form is invalid");
        return;
      }

      setIsPaying(true);

      try {
        await cardFieldsForm.submit();
      } catch (err) {
        console.error("Error during submission:", err);
        setIsPaying(false);
      }
    };

    return (
      <button
        className={isPaying ? "btn" : "btn btn-primary"}
        style={{ float: "right" }}
        onClick={handleClick}
        disabled={isPaying}
      >
        {isPaying ? <div className="spinner tiny" /> : "Pay"}
      </button>
    );
  };

  if (!course) return null;

  return (
    <div className="payment">
      <div className="payment__container">
        {/* Order Summary */}
        <div className="payment__preview">
          <CoursePreview course={course} />
        </div>

        {/* Pyament Form */}
        <div className="payment__form-container">
          <>
            {isPending ? <h2>Load Smart Payment Button...</h2> : null}
            <div className="payment__content">
              <div className="payment__method">
                <div className="payment__card-container">
                  <div className="payment__card-element">
                    <PayPalButtons
                      createOrder={createOrder}
                      onApprove={captureOrder}
                      onError={onError}
                    />
                  </div>

                  <PayPalCardFieldsProvider
                    createOrder={createOrder}
                    onApprove={captureOrder}
                    onError={onError}
                  >
                    <PayPalCardFieldsForm />
                    <SubmitPayment
                      isPaying={isPaying}
                      setIsPaying={setIsPaying}
                      billingAddress={billingAddress}
                    />
                  </PayPalCardFieldsProvider>
                </div>
              </div>
            </div>
          </>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="payment__actions">
        <Button
          className="hover:bg-white-50/10"
          onClick={handleSignOutAndNavigate}
          variant="outline"
          type="button"
        >
          Switch Account
        </Button>
      </div>
    </div>
  );
};

const PaymentPage = () => {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        components: "card-fields,buttons",
      }}
    >
      <PaymentPageContent />
    </PayPalScriptProvider>
  );
};

export default PaymentPage;
