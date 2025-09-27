// Script ini bergantung pada ketersediaan variabel global:
// auth, database, window.terbilang, window.printDiv, window.closeInvoiceModal, window.closeReceiptModal

// --- MODAL LOGIC (INVOICE & RECEIPT) ---
const invoiceModal = document.getElementById('invoice-view-modal');
const invoiceContent = document.getElementById('invoice-print-area');
const receiptModal = document.getElementById('receipt-view-modal');
const receiptContent = document.getElementById('receipt-print-area');

function closeInvoiceModal() { invoiceModal.classList.add('hidden'); }
function closeReceiptModal() { receiptModal.classList.add('hidden'); }


// Fungsi Bantuan untuk mengirim pesan (dipertahankan di sini agar dapat menggunakan auth dan database)
function sendToWhatsApp(invoice, customer) {
    const total = Number(invoice.amount) + (Number(invoice.amount) * 0.10);
    const message = `Halo ${customer.name},\n\nTagihan Wi-Fi Anda untuk periode ${invoice.period} sebesar Rp ${total.toLocaleString('id-ID')} akan jatuh tempo pada ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}. Terima kasih.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${customer.no_telpon.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
}

function sendToEmail(invoice, customer) {
    if (!customer.email) { 
        console.error('ERROR: Email pelanggan tidak ditemukan.'); 
        return; 
    }
    const total = Number(invoice.amount) + (Number(invoice.amount) * 0.10);
    const subject = `Tagihan Wi-Fi Anda - Invoice ${invoice.id}`;
    const body = `Yth. ${customer.name},\n\nTagihan Wi-Fi Anda sebesar Rp ${total.toLocaleString('id-ID')} akan jatuh tempo pada ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}.\n\nTerima kasih.`;
    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}


// FUNGSI UTAMA MODAL INVOICE
async function openInvoiceModal(invoice) {
    const user = auth.currentUser;
    if (!user) return;
    const customerRef = database.ref('customers/' + user.uid);
    const snapshot = await customerRef.once('value');
    const customer = snapshot.val();
    
    if (!invoice || !customer) return;

    // Mengaitkan fungsi ke tombol di modal
    document.getElementById('send-wa-btn').onclick = () => sendToWhatsApp(invoice, customer);
    document.getElementById('send-email-btn').onclick = () => sendToEmail(invoice, customer);
    
    const subtotal = Number(invoice.amount);
    const ppn = subtotal * 0.10;
    const total = subtotal + ppn;

    let statusBanner = '';
    if (invoice.status && invoice.status.toUpperCase() === 'SUDAH BAYAR') {
        statusBanner = `<div style="position: absolute; top: 30px; right: -50px; padding: 8px 0; width: 220px; text-align: center; transform: rotate(45deg); font-size: 16px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.1); background: #22c55e; color: white;">LUNAS</div>`;
    } else {
        statusBanner = `<div style="position: absolute; top: 30px; right: -50px; padding: 8px 0; width: 220px; text-align: center; transform: rotate(45deg); font-size: 16px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.1); background: #f59e0b; color: white;">PENDING</div>`;
    }

    invoiceContent.innerHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 13px; position: relative; overflow: hidden; border-radius: 0.5rem; padding: 2.5rem;">
            ${statusBanner}
            <table width="100%" style="border: none;">
                <tr>
                    <td style="border: none; vertical-align: top;">
                        <div style="display: flex; align-items: flex-start;">
                            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjxpXhyphenhyphenV9p7cBQ2T7sXTJVPH1rS61qv2j_NtsQYrSom9dqETmEIwa3hTpH0_3xxumiWcixpDvlaVGTqqvZ-4ikHEOKvETHLkH8nxOw6KuaMJOtXeLCi_ditAFLM2OTNdszZAxk9grPxmDVlY2mFVQ_EFIebH8clxcUMl1XjfoUVula00prTmc5lf0dRgh2H/s1600/baraya.png" alt="Logo Perusahaan" style="height: 60px; margin-right: 20px;">
                            <div>
                                <b>PT. Wi-Fi Anda Corp.</b><br>
                                Jl. Internet Cepat No. 1<br>
                                Jakarta, 12345<br>
                                PH: +62 812 3456 7890
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
            <div style="background-color: #f3f3f3; padding: 10px; margin-top: 20px;">
                <b>Invoice #${invoice.id}</b><br>
                Tanggal Invoice: ${new Date(invoice.paidAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <table width="100%" style="border: none; margin-top: 20px;">
                <tr>
                    <td style="width: 50%; vertical-align: top; border: none;">
                        <b>Tagihan Kepada</b><br>
                        ${customer.name}<br>
                        ${customer.alamat || ''}<br>
                        ${customer.no_telpon}
                    </td>
                    <td style="width: 50%; vertical-align: top; border: none;">
                        <b>Metode Pembayaran</b><br>
                        Bank Transfer<br>
                        Bank BCA Graha Cibinong<br>
                        No Rekening : 1234567890<br>
                        Atas Nama : PT. Wi-Fi Anda Corp.
                    </td>
                </tr>
            </table>
            <table width="100%" style="border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th style="padding: 8px 12px; border: 1px solid #ccc; background-color: #f0f0f0;">Deskripsi</th>
                        <th style="padding: 8px 12px; border: 1px solid #ccc; background-color: #f0f0f0; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">Langganan Internet - ${invoice.period}</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;">Rp ${subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;"><b>Subtotal</b></td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;">Rp ${subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;"><b>10.00% PPN</b></td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;">Rp ${ppn.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;"><b>Total</b></td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;"><b>Rp ${total.toLocaleString('id-ID')}</b></td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top: 40px; font-size: 11px;">
                Invoice dibuat pada ${new Date(invoice.paidAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h3 style="margin-top: 20px; margin-bottom: 10px;">Alternatif Pembayaran</h3>
            <table width="100%" style="border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr>
                        <th style="padding: 8px 12px; border: 1px solid #ccc; background-color: #f0f0f0;">Metode</th>
                        <th style="padding: 8px 12px; border: 1px solid #ccc; background-color: #f0f0f0;">Nomor Rekening / HP</th>
                        <th style="padding: 8px 12px; border: 1px solid #ccc; background-color: #f0f0f0;">Atas Nama</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">Bank BRI</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">0123-456-78910</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">PT. Wi-Fi Anda Corp.</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">OVO</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">0812-3456-7890</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">PT. Wi-Fi Anda Corp.</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">DANA</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">0812-3456-7890</td>
                        <td style="padding: 8px 12px; border: 1px solid #ccc;">PT. Wi-Fi Anda Corp.</td>
                    </tr>
                </tbody>
            </table>
            <p style="font-size: 11px; color: #555; margin-top: 10px;">Harap lakukan konfirmasi setelah melakukan pembayaran melalui metode alternatif.</p>
        </div>`;
    invoiceModal.classList.remove('hidden');
}


// FUNGSI UTAMA MODAL KUITANSI
async function openReceiptModal(invoice) {
    const user = auth.currentUser;
    if (!user) return;
    const customerRef = database.ref('customers/' + user.uid);
    const snapshot = await customerRef.once('value');
    const customer = snapshot.val();
    
    if (!invoice || !customer) return;

    const totalAmount = Number(invoice.amount) + (Number(invoice.amount) * 0.10);
    // Menggunakan window.terbilang yang dipasang dari index.html
    const amountInWords = window.terbilang(totalAmount); 
    
    receiptContent.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; font-size: 14px; color: #333; padding: 2rem;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: nowrap; gap: 1rem; border-bottom: 2px solid #f0f0f0; padding-bottom: 1.5rem;">
                <div style="flex: 1 1 250px;">
                    <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjxpXhyphenhyphenV9p7cBQ2T7sXTJVPH1rS61qv2j_NtsQYrSom9dqETmEIwa3hTpH0_3xxumiWcixpDvlaVGTqqvZ-4ikHEOKvETHLkH8nxOw6KuaMJOtXeLCi_ditAFLM2OTNdszZAxk9grPxmDVlY2mFVQ_EFIebH8clxcUMl1XjfoUVula00prTmc5lf0dRgh2H/s1600/baraya.png" alt="Logo Perusahaan" style="height: 50px; margin-bottom: 1rem;">
                    <p style="font-weight: bold; font-size: 16px;">PT. Wi-Fi Anda Corp.</p>
                    <p style="font-size: 12px; line-height: 1.5; color: #666;">
                        Jl. Internet Cepat No. 1<br>
                        Jakarta, 12345<br>
                        Tel. 021-123-4567
                    </p>
                </div>
                <div style="flex-shrink: 0; text-align: right;">
                    <h2 style="font-size: 22px; font-weight: 700; margin: 0; color: #111;">KWITANSI</h2>
                    <p style="font-size: 14px; color: #555; margin: 0.25rem 0 1rem 0;">BARAYA.NET</p>
                    <p style="font-size: 12px;"><strong>No:</strong> ${invoice.id.replace('INV', 'KW')}</p>
                </div>
            </div>

            <!-- Details Table -->
            <div style="margin-top: 2rem;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tbody>
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #eee; background-color: #f9f9f9; width: 30%;">
                                <b>Sudah Terima Dari</b><br><i style="font-size: 11px; color: #666;">Received From</i>
                            </td>
                            <td style="padding: 0.75rem; border: 1px solid #eee;">${customer.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #eee; background-color: #f9f9f9;">
                                <b>Banyaknya Uang</b><br><i style="font-size: 11px; color: #666;">Amount Received</i>
                            </td>
                            <td style="padding: 0.75rem; border: 1px solid #eee; font-style: italic; text-transform: capitalize;">${amountInWords} Rupiah</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #eee; background-color: #f9f9f9;">
                                <b>Untuk Pembayaran</b><br><i style="font-size: 11px; color: #666;">In Payment Of</i>
                            </td>
                            <td style="padding: 0.75rem; border: 1px solid #eee;">Pembayaran tagihan internet periode ${invoice.period}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Total & Signature -->
            <div style="margin-top: 2.5rem;">
                <div style="background-color: #f0f8ff; border: 1px solid #d1eaff; padding: 1rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                   <p style="font-size: 14px; font-weight: 500; color: #333; margin: 0;">Total Pembayaran:</p>
                   <p style="font-size: 22px; font-weight: 700; color: #000; margin: 0;">Rp ${totalAmount.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; text-align: center; margin-top: 2rem;">
                <div style="width: 220px; position: relative;">
                     <p style="font-size: 13px; margin-bottom: 50px;">Jakarta, ${new Date(invoice.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                     <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeJjXJlFi55vypK_cFbdJ_gB0RMNxZRd5vq_KdlNhwg-28Jtir-EgLHLKjE6JcU3RdDE9fs05C4fduQsARVt2HQB8IKf5mo4OL2b_8YmyBe9S-fjMfWiUKam7_uGSR8Tge1uViG_Ssb8nUdfBI7v3FIJavWMUZc2emnkegsPV9_0IYbQEDonXFf767z2ek/s1600/stemplewifi.png" alt="Stempel" 
                         style="position: absolute; left: 50%; top: 10px; transform: translateX(-50%); height: 85px; width: auto; object-fit: contain; z-index: 1;">
                     <p style="font-size: 13px; font-weight: bold; margin:0; position: relative; z-index: 2;">Kiki Iswandi Santoso</p>
                     <p style="font-size: 12px; color: #666; position: relative; z-index: 2;">Direktur</p>
                </div>
            </div>
        </div>`;
    receiptModal.classList.remove('hidden');
}

// Pasang fungsi ke window agar dapat dipanggil dari HTML
window.openInvoiceModal = openInvoiceModal;
window.openReceiptModal = openReceiptModal;
window.closeInvoiceModal = closeInvoiceModal;
window.closeReceiptModal = closeReceiptModal;
window.sendToWhatsApp = sendToWhatsApp;
window.sendToEmail = sendToEmail;
