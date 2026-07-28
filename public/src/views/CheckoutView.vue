<template>
  <div class="page" style="max-width:900px">
    <h1>Checkout</h1>

    <div v-if="cartStore.loading" class="loading">Loading cart...</div>
    <div v-else-if="!cartStore.items.length" class="shop-empty">
      <h3>Your cart is empty</h3>
      <router-link to="/" class="btn btn-primary" style="margin-top:12px;display:inline-block">Shop Now</router-link>
    </div>

    <div v-else class="checkout-layout">
      <div class="checkout-form">
        <h2 style="margin-bottom:16px">Shipping Address</h2>
        <div class="form-group">
          <label>Full Address</label>
          <textarea v-model="address" rows="3" placeholder="Street, city, province, postal code" required></textarea>
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input v-model="phone" type="tel" placeholder="08xxxxxxxxxx" required />
        </div>
        <div class="form-group">
          <label>Order Notes (optional)</label>
          <textarea v-model="notes" rows="2" placeholder="e.g. leave at front door"></textarea>
        </div>
        <button class="btn btn-primary btn-full" :disabled="submitting || !address || !phone" @click="placeOrder">
          {{ submitting ? 'Processing...' : 'Place Order — ' + formatIDR(cartStore.subtotal) }}
        </button>
      </div>

      <div class="checkout-summary">
        <h3 style="margin-bottom:12px">Order Summary</h3>
        <div v-for="item in cartStore.items" :key="item.id" class="checkout-item">
          <span>{{ item.product?.name }} × {{ item.quantity }}</span>
          <span class="text-idr">{{ formatIDR(Number(item.price) * item.quantity) }}</span>
        </div>
        <div class="checkout-total">
          <span>Total</span>
          <span class="text-idr">{{ formatIDR(cartStore.subtotal) }}</span>
        </div>

        <div class="qr-section" v-if="showQR">
          <h3 style="margin-bottom:12px">Pay via QRIS</h3>
          <img src="/qr.pembayaran.jpeg" alt="QRIS Payment" />
          <p>Scan this QR code with your e-wallet or banking app to pay.</p>
          <p class="text-muted" style="font-size:13px">Order will be confirmed after payment verification.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { createOrder } from '../api/orders'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToastStore()
const address = ref('')
const phone = ref('')
const notes = ref('')
const submitting = ref(false)
const showQR = ref(false)

const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val))

async function placeOrder() {
  if (!address.value || !phone.value) return
  submitting.value = true
  try {
    const res = await createOrder({
      shippingAddress: address.value,
      phone: phone.value,
      notes: notes.value,
    })
    await cartStore.clearCart()
    toast.success('Order placed! Scan QR to pay.')
    router.push(`/orders/${res.data.data.id}`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to place order')
  } finally { submitting.value = false }
}

onMounted(() => { cartStore.fetchCart(); setTimeout(() => showQR.value = true, 500) })
</script>
