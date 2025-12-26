'use client';
import {useEffect, useMemo, useState} from 'react';
import styles from './page.module.scss';

interface Certificate {
    id: string;
    domains: string;
    domainsHash: string;
    expiresAt: string;
    issuedAt: string;
    lastUsedAt: string;
    isOrphaned: boolean;
    status: string;
    failureReason?: string;
    retryAfter?: string;
    failureCount: number;
    issuedByNode?: string;
    createdAt: string;
    updatedAt: string;
}

type TabType = 'list' | 'upload' | 'generate';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    // Upload form
    const [uploadDomains, setUploadDomains] = useState('');
    const [uploadCertPem, setUploadCertPem] = useState('');
    const [uploadKeyPem, setUploadKeyPem] = useState('');

    // Generate form
    const [generateDomains, setGenerateDomains] = useState('');

    // Toast
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3200);
    };

    const refresh = async () => {
        try {
            const res = await fetch('/api/certificates');
            if (!res.ok) throw new Error('Failed to fetch certificates');
            const data = await res.json();
            setCertificates(data);
        } catch (error) {
            showToast('Failed to load certificates', 'error');
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const domains = uploadDomains.split(/[;,\n]/).map(d => d.trim()).filter(Boolean);
            const res = await fetch('/api/certificates/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    domains,
                    certPem: uploadCertPem,
                    keyPem: uploadKeyPem
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Upload failed');
            }

            showToast('Certificate uploaded successfully', 'success');
            setUploadDomains('');
            setUploadCertPem('');
            setUploadKeyPem('');
            setActiveTab('list');
            refresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const domains = generateDomains.split(/[;,\n]/).map(d => d.trim()).filter(Boolean);
            const res = await fetch('/api/certificates/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({domains}),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Generation failed');
            }

            showToast('Self-signed certificate generated successfully', 'success');
            setGenerateDomains('');
            setActiveTab('list');
            refresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this certificate?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/certificates/${id}`, {method: 'DELETE'});
            if (!res.ok) throw new Error('Delete failed');

            showToast('Certificate deleted successfully', 'success');
            refresh();
        } catch (error) {
            showToast('Failed to delete certificate', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/certificates/${id}/renew`, {method: 'POST'});
            if (!res.ok) throw new Error('Renewal failed');

            showToast('Certificate renewal initiated', 'success');
            refresh();
        } catch (error) {
            showToast('Failed to renew certificate', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (cert: Certificate) => {
        const expiresAt = new Date(cert.expiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (cert.status === 'failed') {
            return <span
                className={`${styles.statusBadge} ${styles.failed}`}>Failed</span>;
        }
        if (cert.status === 'pending') {
            return <span
                className={`${styles.statusBadge} ${styles.pending}`}>Pending</span>;
        }
        if (daysUntilExpiry < 0) {
            return <span
                className={`${styles.statusBadge} ${styles.expired}`}>Expired</span>;
        }
        if (daysUntilExpiry < 14) {
            return <span
                className={`${styles.statusBadge} ${styles.expiringSoon}`}>Expires in {daysUntilExpiry}d</span>;
        }
        return <span
            className={`${styles.statusBadge} ${styles.active}`}>Active</span>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const domainList = (domainsStr: string) => {
        return domainsStr.split(';').map(d => d.trim()).filter(Boolean);
    };

    const sortedCertificates = useMemo(() => {
        return [...certificates].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [certificates]);

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.heading}>SSL Certificates</h2>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    Certificates ({certificates.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    Upload Certificate
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
                    onClick={() => setActiveTab('generate')}
                >
                    Generate Self-Signed
                </button>
            </div>

            {activeTab === 'list' && (
                <>
                    {sortedCertificates.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No certificates found</p>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`${styles.button} ${styles.primary}`}
                            >
                                Upload Your First Certificate
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tableOuterPad}>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Domains</th>
                                        <th>Issued</th>
                                        <th>Expires</th>
                                        <th>Issued By</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedCertificates.map((cert) => (
                                        <tr key={cert.id}>
                                            <td>{getStatusBadge(cert)}</td>
                                            <td>
                                                <ul className={styles.domainList}>
                                                    {domainList(cert.domains).map((domain, i) => (
                                                        <li key={i}>{domain}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td>{formatDate(cert.issuedAt)}</td>
                                            <td>{formatDate(cert.expiresAt)}</td>
                                            <td>{cert.issuedByNode || '-'}</td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '8px'
                                                }}>
                                                    <button
                                                        onClick={() => setSelectedCert(cert)}
                                                        className={`${styles.button} ${styles.neutral}`}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleRenew(cert.id)}
                                                        className={`${styles.button} ${styles.success}`}
                                                        disabled={loading}
                                                    >
                                                        Renew
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cert.id)}
                                                        className={`${styles.button} ${styles.danger}`}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'upload' && (
                <div className={styles.tableOuterPad}>
                    <form onSubmit={handleUpload}>
                        <label>
                            Domains (one per line or semicolon-separated)
                            <textarea
                                value={uploadDomains}
                                onChange={(e) => setUploadDomains(e.target.value)}
                                placeholder="example.com&#10;www.example.com"
                                required
                            />
                        </label>
                        <label>
                            Certificate PEM
                            <textarea
                                value={uploadCertPem}
                                onChange={(e) => setUploadCertPem(e.target.value)}
                                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                required
                            />
                        </label>
                        <label>
                            Private Key PEM
                            <textarea
                                value={uploadKeyPem}
                                onChange={(e) => setUploadKeyPem(e.target.value)}
                                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                required
                            />
                        </label>
                        <div className={styles.modalActions}>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`${styles.button} ${styles.primary}`}
                            >
                                {loading ? 'Uploading...' : 'Upload Certificate'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('list')}
                                className={`${styles.button} ${styles.neutral}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'generate' && (
                <div className={styles.tableOuterPad}>
                    <form onSubmit={handleGenerate}>
                        <label>
                            Domains (one per line or semicolon-separated)
                            <textarea
                                value={generateDomains}
                                onChange={(e) => setGenerateDomains(e.target.value)}
                                placeholder="example.com&#10;www.example.com"
                                required
                            />
                        </label>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            marginTop: '-12px'
                        }}>
                            Note: Self-signed certificates are only suitable for
                            development and testing.
                            Browsers will show security warnings for self-signed
                            certificates.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`${styles.button} ${styles.primary}`}
                            >
                                {loading ? 'Generating...' : 'Generate Self-Signed Certificate'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('list')}
                                className={`${styles.button} ${styles.neutral}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedCert && (
                <div className={styles.modalOverlay}
                     onClick={() => setSelectedCert(null)}>
                    <div className={styles.modal}
                         onClick={(e) => e.stopPropagation()}>
                        <h3>Certificate Details</h3>
                        <dl className={styles.certInfo}>
                            <dt>ID</dt>
                            <dd>{selectedCert.id}</dd>

                            <dt>Domains</dt>
                            <dd>
                                <ul className={styles.domainList}>
                                    {domainList(selectedCert.domains).map((domain, i) => (
                                        <li key={i}>{domain}</li>
                                    ))}
                                </ul>
                            </dd>

                            <dt>Status</dt>
                            <dd>{getStatusBadge(selectedCert)}</dd>

                            <dt>Issued At</dt>
                            <dd>{formatDate(selectedCert.issuedAt)}</dd>

                            <dt>Expires At</dt>
                            <dd>{formatDate(selectedCert.expiresAt)}</dd>

                            <dt>Last Used</dt>
                            <dd>{formatDate(selectedCert.lastUsedAt)}</dd>

                            <dt>Issued By Node</dt>
                            <dd>{selectedCert.issuedByNode || 'Unknown'}</dd>

                            {selectedCert.failureReason && (
                                <>
                                    <dt>Failure Reason</dt>
                                    <dd style={{color: '#e74c3c'}}>{selectedCert.failureReason}</dd>
                                </>
                            )}

                            <dt>Failure Count</dt>
                            <dd>{selectedCert.failureCount}</dd>

                            <dt>Orphaned</dt>
                            <dd>{selectedCert.isOrphaned ? 'Yes' : 'No'}</dd>
                        </dl>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setSelectedCert(null)}
                                className={`${styles.button} ${styles.neutral}`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={styles.toastViewport}>
                    <div
                        className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}

