document.addEventListener("DOMContentLoaded", async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  //   const { publishableKey } = await fetch("/config").then((r) => r.json());
  //   if (!publishableKey) {
  //     addMessage(
  //       "No publishable key returned from the server. Please check `.env` and try again"
  //     );
  //     alert("Please set your Stripe publishable API key in the .env file");
  //   }

  const publishableKey =
    "pk_test_51NdZvISDimqqaRMMXUYt0EYGPZ9cnXfW4AXjN9OvdbGNz9y6B6FZqzTYDNZRqmTAMrJ3w5QqvWuMpBRzvfQ3vBf500ti1SJ2LP";

  const stripe = Stripe(publishableKey);

  const elements = stripe.elements();
  const card = elements.create("card");
  card.mount("#card-element");

  // When the form is submitted...
  const form = document.getElementById("payment-form");
  let submitted = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if (submitted) {
      return;
    }
    submitted = true;
    form.querySelector("button").disabled = true;

    // Make a call to the server to create a new
    // payment intent and store its client_secret.
    const { error: backendError, clientSecret } = await fetch(
      "/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: "usd",
          paymentMethodType: "card",
        }),
      }
    ).then((r) => r.json());

    if (backendError) {
      console.log(backendError);

      // reenable the form.
      submitted = false;
      form.querySelector("button").disabled = false;
      return;
    }

    console.log(`Client secret returned.`);

    const nameInput = document.querySelector("#name");

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: "faizan",
          },
        },
      });

    if (stripeError) {
      console.log(stripeError.message);

      // reenable the form.
      submitted = false;
      form.querySelector("button").disabled = false;
      return;
    }

    console.log(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);

    console.log(paymentIntent);
  });
});
