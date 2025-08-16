// API Configuration
const API_BASE_URL = window.location.origin;

// Global state
let currentUser = null;
let authToken = null;
let currentContractId = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    authToken = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (!authToken || !userInfo) {
        window.location.href = '/login';
        return;
    }
    
    try {
        currentUser = JSON.parse(userInfo);
        initializeDashboard();
    } catch (error) {
        console.error('Error parsing user info:', error);
        logout();
    }
});

async function initializeDashboard() {
    // Update user info in header
    document.getElementById('userName').textContent = currentUser.user_name;
    document.getElementById('userId').textContent = `(${currentUser.user_id})`;
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    await loadDashboardData();
    
    // Show default tab
    showTab('create');
}

function setupEventListeners() {
    // Contract form
    document.getElementById('contractForm').addEventListener('submit', handleCreateContract);
    
    // Sign contract button in modal
    document.getElementById('signContractBtn').addEventListener('click', handleSignContract);
    
    // File input change handler
    document.getElementById('contractPdf').addEventListener('change', function(event) {
        const fileLabel = document.getElementById('fileLabel');
        const file = event.target.files[0];
        
        if (file) {
            if (file.type !== 'application/pdf') {
                showToast('Please select a PDF file only', 'error');
                event.target.value = '';
                fileLabel.textContent = 'Choose PDF file...';
                return;
            }
            fileLabel.textContent = file.name;
        } else {
            fileLabel.textContent = 'Choose PDF file...';
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const contractModal = document.getElementById('contractModal');
        const blockModal = document.getElementById('blockModal');
        
        if (event.target === contractModal) {
            closeModal();
        }
        if (event.target === blockModal) {
            closeBlockModal();
        }
    });
}

async function loadDashboardData() {
    try {
        // Load blockchain info and stats
        await Promise.all([
            loadBlockchainStats(),
            loadPendingContracts(),
            loadAllContracts(),
            loadBlockchain()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

async function loadBlockchainStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/blockchain/info`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('totalUsers').textContent = data.consensus_info.total_users;
            document.getElementById('pendingContracts').textContent = data.consensus_info.pending_contracts;
            document.getElementById('completedContracts').textContent = data.consensus_info.completed_contracts;
            document.getElementById('blockchainSize').textContent = data.chain_size;
            
            // Update blockchain status
            const statusElement = document.getElementById('blockchainStatus');
            if (data.is_valid) {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Valid';
                statusElement.className = 'status-indicator valid';
            } else {
                statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid';
                statusElement.className = 'status-indicator invalid';
            }
        }
    } catch (error) {
        console.error('Error loading blockchain stats:', error);
    }
}

async function loadPendingContracts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/contracts/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPendingContracts(data.pending_contracts);
        }
    } catch (error) {
        console.error('Error loading pending contracts:', error);
        document.getElementById('pendingList').innerHTML = 
            '<div class="error-message">Error loading pending contracts</div>';
    }
}

async function loadAllContracts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/contracts/all`);
        
        if (response.ok) {
            const data = await response.json();
            displayAllContracts(data.contracts);
        }
    } catch (error) {
        console.error('Error loading contracts:', error);
        document.getElementById('contractsList').innerHTML = 
            '<div class="error-message">Error loading contracts</div>';
    }
}

async function loadBlockchain() {
    try {
        const infoResponse = await fetch(`${API_BASE_URL}/api/blockchain/info`);
        
        if (infoResponse.ok) {
            const info = await infoResponse.json();
            const blocks = [];
            
            // Load all blocks
            for (let i = 0; i < info.chain_size; i++) {
                try {
                    const blockResponse = await fetch(`${API_BASE_URL}/api/block/${i}`);
                    if (blockResponse.ok) {
                        const blockData = await blockResponse.json();
                        blocks.push(blockData.block);
                    }
                } catch (error) {
                    console.error(`Error loading block ${i}:`, error);
                }
            }
            
            displayBlockchain(blocks);
        }
    } catch (error) {
        console.error('Error loading blockchain:', error);
        document.getElementById('blockchainList').innerHTML = 
            '<div class="error-message">Error loading blockchain</div>';
    }
}

function displayPendingContracts(contracts) {
    const container = document.getElementById('pendingList');
    
    if (!contracts || contracts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No contracts pending your signature</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = contracts.map(contract => `
        <div class="contract-item" onclick="showContractDetails('${contract.contract_id}')">
            <div class="contract-header">
                <span class="contract-id">Contract ${contract.contract_id.substring(0, 8)}...</span>
                <span class="contract-status status-pending">Pending</span>
            </div>
            <div class="contract-details">
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">$${contract.contract_data.amount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">From → To</div>
                    <div class="detail-value">${contract.contract_data.sender} → ${contract.contract_data.receiver}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Creator</div>
                    <div class="detail-value">${contract.creator}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Signatures</div>
                    <div class="detail-value">${contract.signatures_received}/${contract.signatures_required}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayAllContracts(contracts) {
    const container = document.getElementById('contractsList');
    
    if (!contracts || contracts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-contract"></i>
                <p>No contracts found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = contracts.map(contract => `
        <div class="contract-item" onclick="showContractDetails('${contract.contract_id}')">
            <div class="contract-header">
                <span class="contract-id">Contract ${contract.contract_id.substring(0, 8)}...</span>
                <span class="contract-status status-${contract.status}">${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
            </div>
            <div class="contract-details">
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">$${contract.contract_data.amount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">From → To</div>
                    <div class="detail-value">${contract.contract_data.sender} → ${contract.contract_data.receiver}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Creator</div>
                    <div class="detail-value">${contract.creator}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Signatures</div>
                    <div class="detail-value">${contract.signatures_received}/${contract.signatures_required}</div>
                </div>
                ${contract.block_index !== undefined ? `
                <div class="detail-item">
                    <div class="detail-label">Block Index</div>
                    <div class="detail-value">#${contract.block_index}</div>
                </div>
                ` : ''}
            </div>
            <div class="signatures-info">
                ${contract.signed_by.map(signer => `
                    <span class="signature-badge">${signer}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function displayBlockchain(blocks) {
    const container = document.getElementById('blockchainList');
    
    if (!blocks || blocks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cubes"></i>
                <p>No blocks found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = blocks.map(block => `
        <div class="block-item" onclick="showBlockDetails(${block.index})">
            <div class="block-header">
                <span class="block-id">Block #${block.index}</span>
                <span class="block-status status-valid">Valid</span>
            </div>
            <div class="block-details">
                <div class="detail-item">
                    <div class="detail-label">Hash</div>
                    <div class="detail-value">${block.hash}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Previous Hash</div>
                    <div class="detail-value">${block.previousHash}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">$${block.data.amount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">From → To</div>
                    <div class="detail-value">${block.data.senderKey} → ${block.data.receiverKey}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Timestamp</div>
                    <div class="detail-value">${new Date(block.data.timestamp * 1000).toLocaleString()}</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleCreateContract(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('contractAmount').value);
    const sender = document.getElementById('contractSender').value.trim();
    const receiver = document.getElementById('contractReceiver').value.trim();
    const description = document.getElementById('contractDescription').value.trim();
    const pdfFile = document.getElementById('contractPdf').files[0];
    
    if (!amount || !sender || !receiver) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('sender', sender);
        formData.append('receiver', receiver);
        formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
        formData.append('description', description || `Transaction from ${sender} to ${receiver}`);
        
        // Add PDF file if selected
        if (pdfFile) {
            formData.append('pdf_file', pdfFile);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/contract/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Don't set Content-Type header - let browser set it for FormData
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            let message = 'Contract created successfully!';
            if (data.pdf && data.pdf.uploaded) {
                message += ` PDF "${data.pdf.filename}" uploaded and anchored to blockchain.`;
            }
            showToast(message, 'success');
            
            // Clear form
            document.getElementById('contractForm').reset();
            document.getElementById('fileLabel').textContent = 'Choose PDF file...';
            
            // Refresh data
            await loadDashboardData();
            
            // Show contract details
            showContractDetails(data.contract_id);
            
        } else {
            showToast(data.detail || 'Failed to create contract', 'error');
        }
        
    } catch (error) {
        console.error('Error creating contract:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function showContractDetails(contractId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/contract/${contractId}`);
        
        if (response.ok) {
            const data = await response.json();
            displayContractModal(data);
            currentContractId = contractId;
        } else {
            showToast('Failed to load contract details', 'error');
        }
        
    } catch (error) {
        console.error('Error loading contract details:', error);
        showToast('Error loading contract details', 'error');
    }
}

function displayContractModal(contract) {
    const modalBody = document.getElementById('contractModalBody');
    const signButton = document.getElementById('signContractBtn');
    
    const canSign = contract.status === 'pending' && 
                   contract.pending_signers.some(signer => signer.user_id === currentUser.user_id);

    const hasPdf = contract.pdf && contract.pdf.path;

    modalBody.innerHTML = `
        <div class="contract-modal-content">
            <div class="detail-item">
                <div class="detail-label">Contract ID</div>
                <div class="detail-value">${contract.contract_id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="contract-status status-${contract.status}">
                        ${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">$${contract.contract_data.amount}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">From</div>
                <div class="detail-value">${contract.contract_data.sender}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">To</div>
                <div class="detail-value">${contract.contract_data.receiver}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Description</div>
                <div class="detail-value">${contract.contract_data.description || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Creator</div>
                <div class="detail-value">${contract.creator}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Signatures</div>
                <div class="detail-value">${contract.signatures_received}/${contract.signatures_required}</div>
            </div>
            ${contract.block_index !== undefined ? `
            <div class="detail-item">
                <div class="detail-label">Blockchain Block</div>
                <div class="detail-value">#${contract.block_index}</div>
            </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">Created</div>
                <div class="detail-value">${new Date(contract.created_at * 1000).toLocaleString()}</div>
            </div>
            ${contract.completed_at ? `
            <div class="detail-item">
                <div class="detail-label">Completed</div>
                <div class="detail-value">${new Date(contract.completed_at * 1000).toLocaleString()}</div>
            </div>
            ` : ''}
        </div>

        <div class="signatures-section">
            <h4>Signatures</h4>
            <div class="signatures-grid">
                ${contract.signers.map(signer => `
                    <div class="signature-item signed">
                        <i class="fas fa-check-circle"></i>
                        <span>${signer.user_name}</span>
                        <small>${signer.signature}</small>
                    </div>
                `).join('')}
                ${contract.pending_signers.map(signer => `
                    <div class="signature-item pending">
                        <i class="fas fa-clock"></i>
                        <span>${signer.user_name}</span>
                        <small>Pending signature</small>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="signatures-section">
            <h4><i class="fas fa-file-pdf"></i> Contract PDF</h4>
            <div class="signatures-grid">
                <div class="signature-item ${hasPdf ? 'signed' : 'pending'}">
                    <i class="fas ${hasPdf ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    <span>${hasPdf ? 'PDF Document Attached' : 'No PDF Document'}</span>
                    <small>${hasPdf ? ('SHA256: ' + contract.pdf.hash.substring(0,16) + '... | Filename: ' + contract.pdf.filename) : 'This contract was created without a PDF document'}</small>
                </div>
            </div>

            ${hasPdf ? `
            <div style="margin-top:12px; display:flex; gap:10px;">
                <a class="btn-primary" style="flex:1; text-decoration:none; text-align:center;" href="${API_BASE_URL}/api/contract/${contract.contract_id}/pdf" target="_blank">
                    <i class="fas fa-eye"></i> View PDF Document
                </a>
                <a class="btn-secondary" style="flex:1; text-decoration:none; text-align:center;" href="${API_BASE_URL}/api/contract/${contract.contract_id}/pdf" download>
                    <i class="fas fa-download"></i> Download PDF
                </a>
            </div>
            ` : `
            <div style="margin-top:12px;">
                <div class="alert-info">
                    <i class="fas fa-info-circle"></i>
                    PDF documents can only be uploaded during contract creation. This contract was created without a PDF attachment.
                </div>
            </div>
            `}
        </div>
    `;

    if (canSign) {
        signButton.style.display = 'block';
    } else {
        signButton.style.display = 'none';
    }

    // No upload functionality during signing - PDFs can only be uploaded during contract creation

    document.getElementById('contractModal').style.display = 'block';
}

async function handleSignContract() {
    if (!currentContractId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/contract/sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                contract_id: currentContractId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.status === 'completed') {
                showToast('Contract signed and added to blockchain!', 'success');
            } else {
                showToast('Contract signed successfully!', 'success');
            }
            
            // Close modal and refresh data
            closeModal();
            await loadDashboardData();
            
        } else {
            showToast(data.detail || 'Failed to sign contract', 'error');
        }
        
    } catch (error) {
        console.error('Error signing contract:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function showBlockDetails(blockIndex) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/block/${blockIndex}`);
        
        if (response.ok) {
            const data = await response.json();
            displayBlockModal(data.block);
        } else {
            showToast('Failed to load block details', 'error');
        }
        
    } catch (error) {
        console.error('Error loading block details:', error);
        showToast('Error loading block details', 'error');
    }
}

function displayBlockModal(block) {
    const modalBody = document.getElementById('blockModalBody');
    
    modalBody.innerHTML = `
        <div class="block-modal-content">
            <div class="detail-item">
                <div class="detail-label">Block Index</div>
                <div class="detail-value">#${block.index}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Block Hash</div>
                <div class="detail-value">${block.hash}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Previous Hash</div>
                <div class="detail-value">${block.previousHash}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">$${block.data.amount}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Sender</div>
                <div class="detail-value">${block.data.senderKey}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Receiver</div>
                <div class="detail-value">${block.data.receiverKey}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Timestamp</div>
                <div class="detail-value">${new Date(block.data.timestamp * 1000).toLocaleString()}</div>
            </div>
        </div>
    `;
    
    document.getElementById('blockModal').style.display = 'block';
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to selected button
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'pending') {
        loadPendingContracts();
    } else if (tabName === 'contracts') {
        loadAllContracts();
    } else if (tabName === 'blockchain') {
        loadBlockchain();
    }
}

// Utility functions
function closeModal() {
    document.getElementById('contractModal').style.display = 'none';
    currentContractId = null;
}

function closeBlockModal() {
    document.getElementById('blockModal').style.display = 'none';
}

async function refreshContracts() {
    await loadDashboardData();
    showToast('Data refreshed!', 'success');
}

async function validateBlockchain() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/blockchain/validate`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.is_valid) {
                showToast('Blockchain is valid!', 'success');
            } else {
                showToast('Blockchain validation failed!', 'error');
            }
            
            await loadBlockchainStats();
        }
    } catch (error) {
        console.error('Error validating blockchain:', error);
        showToast('Error validating blockchain', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 