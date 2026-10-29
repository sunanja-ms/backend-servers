<template>
  <div class="page" style="max-width:800px">
    <div v-if="loading" class="loading">Loading order...</div>

    <div v-else-if="order">
      <div class="page-header">
        <h1>Order #{{ order.id }}</h1>
        <div class="actions">
          <button class="btn btn-sm" @click="downloadReceipt">Receipt</button>
          <span :class="'order-status-badge order-status-' + order.status">{{ order.status }}</span>
        </div>
      </div>

      <div class="order-detail-card">
        <div class="order-detail-grid">
          <div>
            <div class="order-detail-label">Shipping Address</div>
            <div class="order-detail-value">{{ order.shippingAddress }}</div>
          </div>
          <div>
            <div class="order-detail-label">Phone</div>
            <div class="order-detail-value">{{ order.phone }}</div>
          </div>
          <div>
            <div class="order-detail-label">Date</div>
            <div class="order-detail-value">{{ new Date(order.createdAt).toLocaleString('en-GB') }}</div>
          </div>
          <div>
            <div class="order-detail-label">Status</div>
            <div class="order-detail-value">{{ order.status }} / {{ order.paymentStatus }}</div>
          </div>
        </div>
      </div>

      <div class="order-detail-card">
        <h3 style="margin-bottom:12px">Items</h3>
        <div class="table-wrap"><table class="order-items-table">
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td>{{ item.productName }}</td>
              <td class="text-idr">{{ formatIDR(item.price) }}</td>
              <td>{{ item.quantity }}</td>
              <td class="text-idr">{{ formatIDR(Number(item.price) * item.quantity) }}</td>
            </tr>
          </tbody>
        </table></div>
        <div style="text-align:right;margin-top:12px;font-size:20px;font-weight:700">
          Total: <span class="text-idr">{{ formatIDR(order.total) }}</span>
        </div>
      </div>

      <div class="order-detail-card" v-if="order.notes">
        <div class="order-detail-label">Notes</div>
        <div class="order-detail-value">{{ order.notes }}</div>
      </div>

      <div class="order-detail-card qr-section" v-if="order.paymentStatus === 'unpaid'">
        <h3>Pay via QRIS</h3>
        <img src="/qr.pembayaran.jpeg" alt="QRIS Payment" />
        <p>Scan to pay with your e-wallet or banking app.</p>
        <div class="payment-proof-section">
          <label class="order-detail-label">Upload Payment Proof (optional)</label>
          <input type="file" accept="image/*" @change="handleProofUpload" />
          <button class="btn btn-sm btn-primary" :disabled="!proofFile" @click="uploadProof" style="margin-top:8px">
            {{ uploading ? 'Uploading...' : 'Upload Proof' }}
          </button>
        </div>
      </div>

      <div class="order-detail-card" v-if="order.paymentProof">
        <div class="order-detail-label">Payment Proof</div>
        <img v-if="proofUrl" :src="proofUrl" alt="Payment proof" />
      </div>
    </div>

    <div v-else class="shop-empty">
      <h3>Order not found</h3>
      <router-link to="/orders" class="btn btn-primary" style="margin-top:12px;display:inline-block">My Orders</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder, uploadPaymentProof, getPaymentProof, getReceipt } from '../api/orders'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const toast = useToastStore()
const order = ref(null)
const loading = ref(true)
const proofFile = ref(null)
const uploading = ref(false)
const proofUrl = ref(null)
let proofObjectUrl = null

async function loadProof() {
  if (!order.value?.paymentProof) return
  try {
    const res = await getPaymentProof(route.params.id)
    proofObjectUrl = URL.createObjectURL(res.data)
    proofUrl.value = proofObjectUrl
  } catch { proofUrl.value = null }
}


function handleProofUpload(e) { proofFile.value = e.target.files[0] || null }

async function uploadProof() {
  if (!proofFile.value) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('proof', proofFile.value)
    await uploadPaymentProof(route.params.id, fd)
    toast.success('Proof uploaded')
    proofFile.value = null
    fetchOrder()
  } catch (e) { toast.error(e.response?.data?.message || 'Upload failed') }
  finally { uploading.value = false }
}

async function fetchOrder() {
  loading.value = true
  try {
    const res = await getOrder(route.params.id)
    order.value = res.data.data
    await loadProof()
  } catch { order.value = null }
  finally { loading.value = false }
}

async function downloadReceipt() {
  try {
    const res = await getReceipt(route.params.id)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Receipt not available')
  }
}

onMounted(fetchOrder)
onUnmounted(() => { if (proofObjectUrl) URL.revokeObjectURL(proofObjectUrl) })
</script>
