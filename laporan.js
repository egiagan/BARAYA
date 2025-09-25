        document.addEventListener('DOMContentLoaded', () => {
            // Konfigurasi Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyBK5dnAnC7__QLKvWfvvUMv3W1rz-kHuBE",
                authDomain: "wifiku-2025.firebaseapp.com",
                databaseURL: "https://wifiku-2025-default-rtdb.firebaseio.com",
                projectId: "wifiku-2025",
                storageBucket: "wifiku-2025.appspot.com",
                messagingSenderId: "138406445283",
                appId: "1:138406445283:web:c01c52b075cf86a08dc5d6"
            };

            // Inisialisasi Firebase
            firebase.initializeApp(firebaseConfig);
            const auth = firebase.auth();
            let currentUser = null;

            const TELEGRAM_BOT_TOKEN = "7773318407:AAGbxlu4MmPpUlBbUjJavO_pRCFdPO29Qsw";
            const TELEGRAM_CHAT_ID = "1286256542";

            // DOM Elements
            const form = document.getElementById('laporan-form');
            const submitButton = document.getElementById('submit-button');
            const userInfoDiv = document.getElementById('user-info');
            const loadingScreen = document.getElementById('loading-screen');
            const fileInput = document.getElementById('file-input');
            const fileDropArea = document.getElementById('file-drop-area');
            const fileInfo = document.getElementById('file-info');
            const filePreview = document.getElementById('file-preview');
            const kategoriSelector = document.getElementById('kategori-selector');
            const kategoriModal = document.getElementById('kategori-modal');
            const kategoriModalOverlay = document.getElementById('kategori-modal-overlay');
            const kategoriText = document.getElementById('kategori-text');
            const kategoriOptions = document.querySelectorAll('input[name="kategori-option"]');
            const permasalahanSelector = document.getElementById('permasalahan-selector');
            const permasalahanModal = document.getElementById('permasalahan-modal');
            const permasalahanModalOverlay = document.getElementById('permasalahan-modal-overlay');
            const permasalahanText = document.getElementById('permasalahan-text');
            const permasalahanOptionsContainer = document.getElementById('permasalahan-options');
            const notifModalOverlay = document.getElementById('notif-modal-overlay');
            const notifModal = document.getElementById('notif-modal');
            const notifText = document.getElementById('notif-text');
            const notifClose = document.getElementById('notif-close');
            const detailLaporanTextarea = document.getElementById('detail-laporan');

            const permasalahanData = {
                "GANGGUAN INTERNET": ["TIDAK BISA AKSES INTERNET", "TIDAK BISA AKSES WEB", "INTERNET LAMBAT"],
                "KENDALA LAINNYA": ["PENGEMBALIAN DANA / REFUND", "PEMASANGAN", "PERMOHONAN PENDAFTARAN"]
            };

            // --- Auth State Logic ---
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentUser = user;
                    userInfoDiv.textContent = `Login sebagai: ${user.displayName || user.email}`;
                    checkFormValidity();
                } else {
                    currentUser = null;
                    userInfoDiv.textContent = 'Anda belum login. Silakan login untuk mengirim laporan.';
                    Array.from(form.elements).forEach(element => element.disabled = true);
                }
            });

            // --- Loading Screen Logic ---
            const showLoading = (isLoading) => {
                loadingScreen.classList.toggle('visible', isLoading);
            };

            // --- Modal Logic ---
            const openModal = (modal, overlay) => {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                modal.classList.add('active');
            };
            const closeModal = (modal, overlay) => {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                modal.classList.remove('active');
            };
            const showNotif = (message) => {
                notifText.textContent = message;
                openModal(notifModal, notifModalOverlay);
            }

            kategoriSelector.addEventListener('click', () => openModal(kategoriModal, kategoriModalOverlay));
            kategoriModalOverlay.addEventListener('click', () => closeModal(kategoriModal, kategoriModalOverlay));
            permasalahanSelector.addEventListener('click', () => {
                if (kategoriText.textContent !== 'Pilih') openModal(permasalahanModal, permasalahanModalOverlay);
            });
            permasalahanModalOverlay.addEventListener('click', () => closeModal(permasalahanModal, permasalahanModalOverlay));
            
            notifClose.addEventListener('click', () => {
                window.location.href = 'beranda.html';
            });
            notifModalOverlay.addEventListener('click', () => closeModal(notifModal, notifModalOverlay));


            // --- Form Logic ---
            const checkFormValidity = () => {
                const isKategoriSelected = kategoriText.textContent !== 'Pilih';
                const isPermasalahanSelected = permasalahanText.textContent !== 'Pilih';
                const isDetailFilled = detailLaporanTextarea.value.trim() !== '';
                if (currentUser && isKategoriSelected && isPermasalahanSelected && isDetailFilled) {
                    submitButton.disabled = false;
                    submitButton.classList.remove('bg-slate-300', 'cursor-not-allowed');
                    submitButton.classList.add('bg-cyan-500', 'hover:bg-cyan-600');
                } else {
                    submitButton.disabled = true;
                    submitButton.classList.add('bg-slate-300', 'cursor-not-allowed');
                    submitButton.classList.remove('bg-cyan-500', 'hover:bg-cyan-600');
                }
            };
            
            detailLaporanTextarea.addEventListener('input', checkFormValidity);

            kategoriOptions.forEach(option => {
                option.addEventListener('change', (e) => {
                    kategoriText.textContent = e.target.value;
                    kategoriText.classList.remove('text-slate-500');
                    permasalahanText.textContent = 'Pilih';
                    permasalahanText.classList.add('text-slate-500');
                    populatePermasalahanOptions(e.target.value);
                    closeModal(kategoriModal, kategoriModalOverlay);
                    checkFormValidity();
                });
            });

            const populatePermasalahanOptions = (kategori) => {
                permasalahanOptionsContainer.innerHTML = '';
                permasalahanData[kategori]?.forEach(opt => {
                    const label = document.createElement('label');
                    label.className = "flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer";
                    label.innerHTML = `<span>${opt}</span><input type="radio" name="permasalahan-option" value="${opt}" class="h-5 w-5 text-cyan-600 border-slate-300 focus:ring-cyan-500">`;
                    label.querySelector('input').addEventListener('change', (e) => {
                        permasalahanText.textContent = e.target.value;
                        permasalahanText.classList.remove('text-slate-500');
                        closeModal(permasalahanModal, permasalahanModalOverlay);
                        checkFormValidity();
                    });
                    permasalahanOptionsContainer.appendChild(label);
                });
            };

            fileDropArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    fileInfo.classList.add('hidden');
                    filePreview.classList.remove('hidden');
                    const reader = new FileReader();
                    reader.onload = (event) => filePreview.src = event.target.result;
                    reader.readAsDataURL(file);
                }
            });

            // --- Submission Logic ---
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!currentUser) {
                    showNotif("Anda harus login untuk mengirim laporan.");
                    return;
                }
                submitButton.disabled = true;
                showLoading(true);

                const kategori = kategoriText.textContent;
                const permasalahan = permasalahanText.textContent;
                const detailLaporan = detailLaporanTextarea.value;
                const file = fileInput.files[0];

                const caption = `Laporan Baru:\n\n` +
                              `👤 Pelapor: ${currentUser.displayName || 'Tidak Ada Nama'}\n` +
                              `📧 Email: ${currentUser.email}\n` +
                              `--------------------------\n` +
                              `Kategori: ${kategori}\n` +
                              `Permasalahan: ${permasalahan}\n` +
                              `--------------------------\n` +
                              `Detail:\n${detailLaporan}`;
                
                const formData = new FormData();
                formData.append('chat_id', TELEGRAM_CHAT_ID);

                let url;
                if (file) {
                    formData.append('caption', caption);
                    if (file.type.startsWith('image/')) {
                        formData.append('photo', file, file.name);
                        url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
                    } else {
                        formData.append('document', file, file.name);
                        url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
                    }
                } else {
                    formData.append('text', caption);
                    url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
                }

                try {
                    const response = await fetch(url, { method: 'POST', body: formData });
                    const result = await response.json();
                    
                    if (result.ok) {
                        setTimeout(() => {
                            showLoading(false);
                            showNotif('Laporan berhasil dikirim!');
                            form.reset();
                            kategoriText.textContent = 'Pilih';
                            kategoriText.classList.add('text-slate-500');
                            permasalahanText.textContent = 'Pilih';
                            permasalahanText.classList.add('text-slate-500');
                            fileInfo.classList.remove('hidden');
                            filePreview.classList.add('hidden');
                            filePreview.src = '';
                            checkFormValidity();
                        }, 700);
                    } else {
                        showLoading(false);
                        showNotif(`Gagal mengirim laporan: ${result.description}`);
                        checkFormValidity();
                    }
                } catch (error) {
                    showLoading(false);
                    showNotif(`Gagal mengirim laporan: ${error.message}`);
                    checkFormValidity();
                }
            });
        });
