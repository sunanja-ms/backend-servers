<template>
  <div class="page cart-page">
    <div class="page-header">
      <h1>Shopping Cart</h1>
      <span class="text-muted">{{ cartStore.totalItems }} item(s)</span>
    </div>

    <div v-if="cartStore.loading" class="loading">Loading cart...</div>

    <template v-else-if="cartStore.items.length">
      <div class="cart-item" v-for="item in cartStore.items" :key="item.id">
        <div class="cart-item-image">Image</div>
        <div class="cart-item-info">
          <div class="cart-item-name">{{ item.product?.name || 'Product' }}</div>
          <div class="cart-item-price text-idr">{{ formatIDR(item.price) }}</div>
        </div>
        <div class="cart-item-qty">
          <button @click="cartStore.updateQty(item.id, item.quantity - 1)">−</button>
          <span>{{ item.quantity }}</span>
          <button @click="cartStore.updateQty(item.id, item.quantity + 1)">+</button>
        </div>
        <div class="cart-item-total text-idr">{{ formatIDR(Number(item.price) * item.quantity) }}</div>
        <button class="cart-item-remove" @click="cartStore.removeItem(item.id)">Remove</button>
      </div>

      <div class="cart-summary">
        <div class="cart-summary-row"><span>Subtotal</span><span class="text-idr">{{ formatIDR(cartStore.subtotal) }}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total</span><span class="text-idr">{{ formatIDR(cartStore.subtotal) }}</span></div>
        <button class="btn btn-primary btn-full" style="margin-top:16px" @click="checkout">Proceed to Checkout</button>
      </div>
    </template>

    <div v-else class="shop-empty">
      <h3>Your cart is empty</h3>
      <p>Browse products and add items to your cart.</p>
      <router-link to="/" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse Products</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

function checkout() {
  if (cartStore.items.length) router.push('/checkout')
}
</script>
