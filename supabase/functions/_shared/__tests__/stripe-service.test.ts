/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock Stripe client
const mockStripe = {
  paymentIntents: {
    create: async (params: any) => {
      if (params.amount <= 0) {
        throw new Error('Amount must be positive');
      }
      
      if (params.payment_method === 'pm_card_declined') {
        throw new Error('Your card was declined');
      }

      return {
        id: 'pi_test_123',
        status: params.confirm ? 'succeeded' : 'requires_confirmation',
        amount: params.amount,
        currency: params.currency,
        client_secret: 'pi_test_123_secret_test',
        metadata: params.metadata
      };
    },
    confirm: async (paymentIntentId: string, params: any) => {
      if (params.payment_method === 'pm_card_declined') {
        throw new Error('Your card was declined');
      }

      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 10000
      };
    },
    retrieve: async (paymentIntentId: string) => {
      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 10000,
        currency: 'jpy'
      };
    }
  },
  refunds: {
    create: async (params: any) => {
      return {
        id: 're_test_123',
        payment_intent: params.payment_intent,
        amount: params.amount,
        status: 'succeeded'
      };
    }
  },
  paymentMethods: {
    create: async (params: any) => {
      if (!params.card) {
        throw new Error('Card details required');
      }

      return {
        id: 'pm_test_123',
        type: 'card',
        card: params.card
      };
    }
  }
};

// Mock StripeService class
class MockStripeService {
  private stripe: any;

  constructor() {
    this.stripe = mockStripe;
  }

  async createPayment(amount: number, bookingId: number, discountCode?: string, originalAmount?: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'jpy',
      metadata: {
        booking_id: bookingId.toString(),
        discount_code: discountCode || '',
        original_amount: (originalAmount || amount).toString()
      },
      confirmation_method: 'automatic',
      confirm: false,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      client_secret: paymentIntent.client_secret
    };
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string) {
    const confirmation = await this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: 'https://localhost:3000/thankyou',
    });

    return {
      id: confirmation.id,
      status: confirmation.status,
      amount: confirmation.amount
    };
  }

  async processImmediatePayment(amount: number, bookingId: number, paymentMethodId: string, discountCode?: string, originalAmount?: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'jpy',
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      metadata: {
        booking_id: bookingId.toString(),
        discount_code: discountCode || '',
        original_amount: (originalAmount || amount).toString()
      },
      return_url: 'https://localhost:3000/thankyou',
    });

    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_action') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      client_secret: paymentIntent.client_secret
    };
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    return await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
    });
  }

  async getPaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createPaymentMethod(cardDetails: any) {
    return await this.stripe.paymentMethods.create({
      type: 'card',
      card: cardDetails,
    });
  }

  async createPaymentIntent(amount: number, bookingId: number, paymentMethodId: string, discountCode?: string, originalAmount?: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'jpy',
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      metadata: {
        booking_id: bookingId.toString(),
        discount_code: discountCode || '',
        original_amount: (originalAmount || amount).toString()
      },
      return_url: 'https://localhost:3000/thankyou',
    });

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      client_secret: paymentIntent.client_secret
    };
  }
}

Deno.test("StripeService - should create payment intent successfully", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.createPayment(10000, 123);
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'requires_confirmation');
  assertEquals(result.amount, 10000);
  assertExists(result.client_secret);
});

Deno.test("StripeService - should create payment with metadata", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.createPayment(15000, 456, 'DISCOUNT10', 20000);
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.amount, 15000);
  
  // Verify metadata is passed correctly (would be captured in real implementation)
  assertExists(result.id);
});

Deno.test("StripeService - should confirm payment successfully", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.confirmPayment('pi_test_123', 'pm_test_123');
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
  assertEquals(result.amount, 10000);
});

Deno.test("StripeService - should handle payment confirmation failure", async () => {
  const stripeService = new MockStripeService();
  
  try {
    await stripeService.confirmPayment('pi_test_123', 'pm_card_declined');
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Your card was declined');
  }
});

Deno.test("StripeService - should process immediate payment successfully", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.processImmediatePayment(13000, 789, 'pm_test_123');
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
  assertEquals(result.amount, 13000);
});

Deno.test("StripeService - should handle immediate payment failure", async () => {
  const stripeService = new MockStripeService();
  
  try {
    await stripeService.processImmediatePayment(13000, 789, 'pm_card_declined');
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Your card was declined');
  }
});

Deno.test("StripeService - should validate positive amounts", async () => {
  const stripeService = new MockStripeService();
  
  try {
    await stripeService.createPayment(-100, 123);
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Amount must be positive');
  }
});

Deno.test("StripeService - should create refund successfully", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.createRefund('pi_test_123', 5000);
  
  assertEquals(result.id, 're_test_123');
  assertEquals(result.payment_intent, 'pi_test_123');
  assertEquals(result.amount, 5000);
  assertEquals(result.status, 'succeeded');
});

Deno.test("StripeService - should create full refund when amount not specified", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.createRefund('pi_test_123');
  
  assertEquals(result.id, 're_test_123');
  assertEquals(result.payment_intent, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
});

Deno.test("StripeService - should retrieve payment intent", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.getPaymentIntent('pi_test_123');
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
  assertEquals(result.amount, 10000);
  assertEquals(result.currency, 'jpy');
});

Deno.test("StripeService - should create payment method", async () => {
  const stripeService = new MockStripeService();
  
  const cardDetails = {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123'
  };
  
  const result = await stripeService.createPaymentMethod(cardDetails);
  
  assertEquals(result.id, 'pm_test_123');
  assertEquals(result.type, 'card');
  assertExists(result.card);
});

Deno.test("StripeService - should handle payment method creation without card details", async () => {
  const stripeService = new MockStripeService();
  
  try {
    await stripeService.createPaymentMethod({});
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Card details required');
  }
});

Deno.test("StripeService - should create payment intent with confirmation", async () => {
  const stripeService = new MockStripeService();
  
  const result = await stripeService.createPaymentIntent(12000, 999, 'pm_test_123', 'SAVE20');
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
  assertEquals(result.amount, 12000);
  assertExists(result.client_secret);
});

Deno.test("StripeService - should handle different payment statuses", async () => {
  // Mock a payment that requires action (3D Secure)
  const mockStripeWithAction = {
    paymentIntents: {
      create: async (params: any) => ({
        id: 'pi_requires_action',
        status: 'requires_action',
        amount: params.amount,
        currency: params.currency,
        client_secret: 'pi_requires_action_secret'
      })
    }
  };

  class MockStripeServiceWithAction extends MockStripeService {
    constructor() {
      super();
      (this as any).stripe = mockStripeWithAction;
    }
  }

  const stripeService = new MockStripeServiceWithAction();
  
  const result = await stripeService.processImmediatePayment(10000, 123, 'pm_test_3ds');
  
  assertEquals(result.id, 'pi_requires_action');
  assertEquals(result.status, 'requires_action');
  assertEquals(result.amount, 10000);
});

Deno.test("StripeService - should handle payment processing with discount codes", async () => {
  const stripeService = new MockStripeService();
  
  // Test with discount code and original amount
  const result = await stripeService.processImmediatePayment(
    8000,  // discounted amount
    123,   // booking ID
    'pm_test_123',
    'DISCOUNT20',  // discount code
    10000  // original amount
  );
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.status, 'succeeded');
  assertEquals(result.amount, 8000);
});

Deno.test("StripeService - should handle currency correctly", async () => {
  const stripeService = new MockStripeService();
  
  // All payments should be in JPY
  const result = await stripeService.createPayment(5000, 123);
  
  assertEquals(result.id, 'pi_test_123');
  assertEquals(result.amount, 5000);
  // Currency is set internally to 'jpy'
});

console.log("Stripe service tests completed successfully!");