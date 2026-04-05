'use client';
import {useEffect, useMemo, useState} from 'react';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Textarea,
} from '@lyttle-development/ui';

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

function getCertBadgeVariant(cert: Certificate): 'success' | 'warning' | 'destructive' | 'secondary' | 'muted' {
    const expiresAt = new Date(cert.expiresAt);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (cert.status === 'failed') return 'destructive';
    if (cert.status === 'pending') return 'secondary';
    if (daysUntilExpiry < 0) return 'destructive';
    if (daysUntilExpiry < 14) return 'warning';
    return 'success';
}

function getCertBadgeLabel(cert: Certificate): string {
    const expiresAt = new Date(cert.expiresAt);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (cert.status === 'failed') return 'Failed';
    if (cert.status === 'pending') return 'Pending';
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry < 14) return `Expires in ${daysUntilExpiry}d`;
    return 'Active';
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    const [uploadDomains, setUploadDomains] = useState('');
    const [uploadCertPem, setUploadCertPem] = useState('');
    const [uploadKeyPem, setUploadKeyPem] = useState('');
    const [generateDomains, setGenerateDomains] = useState('');

    const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3200);
    };

    const refresh = async () => {
        try {
            const res = await fetch('/api/certificates');
            if (!res.ok) throw new Error('Failed to fetch certificates');
            setCertificates(await res.json());
        } catch {
            showToast('Failed to load certificates', 'error');
        }
    };

    useEffect(() => { refresh(); }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const domains = uploadDomains.split(/[;,\n]/).map(d => d.trim()).filter(Boolean);
            const res = await fetch('/api/certificates/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({domains, certPem: uploadCertPem, keyPem: uploadKeyPem}),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Upload failed'); }
            showToast('Certificate uploaded successfully', 'success');
            setUploadDomains(''); setUploadCertPem(''); setUploadKeyPem('');
            setActiveTab('list');
            refresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
        } finally { setLoading(false); }
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
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Generation failed'); }
            showToast('Self-signed certificate generated successfully', 'success');
            setGenerateDomains('');
            setActiveTab('list');
            refresh();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Generation failed', 'error');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this certificate?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/certificates/${id}`, {method: 'DELETE'});
            if (!res.ok) throw new Error('Delete failed');
            showToast('Certificate deleted successfully', 'success');
            refresh();
        } catch { showToast('Failed to delete certificate', 'error'); }
        finally { setLoading(false); }
    };

    const handleRenew = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/certificates/${id}/renew`, {method: 'POST'});
            if (!res.ok) throw new Error('Renewal failed');
            showToast('Certificate renewal initiated', 'success');
            refresh();
        } catch { showToast('Failed to renew certificate', 'error'); }
        finally { setLoading(false); }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
    const domainList = (str: string) => str.split(';').map(d => d.trim()).filter(Boolean);

    const sortedCertificates = useMemo(() =>
        [...certificates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [certificates]
    );

    const formStyle: React.CSSProperties = {display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '36rem'};
    const labelStyle: React.CSSProperties = {display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500, fontSize: '0.875rem'};

    return (
        <div style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 700}}>SSL Certificates</h2>

            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabType)}>
                <TabsList>
                    <TabsTrigger value="list">Certificates ({certificates.length})</TabsTrigger>
                    <TabsTrigger value="upload">Upload Certificate</TabsTrigger>
                    <TabsTrigger value="generate">Generate Self-Signed</TabsTrigger>
                </TabsList>

                <TabsContent value="list" style={{paddingTop: '1rem'}}>
                    {sortedCertificates.length === 0 ? (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0', color: 'var(--muted-foreground)'}}>
                            <p>No certificates found</p>
                            <Button onClick={() => setActiveTab('upload')}>Upload Your First Certificate</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Domains</TableHead>
                                    <TableHead>Issued</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Issued By</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCertificates.map((cert) => (
                                    <TableRow key={cert.id}>
                                        <TableCell>
                                            <Badge variant={getCertBadgeVariant(cert)}>{getCertBadgeLabel(cert)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                                                {domainList(cert.domains).map((domain, i) => (
                                                    <li key={i} style={{fontSize: '0.875rem'}}>{domain}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell style={{fontSize: '0.875rem'}}>{formatDate(cert.issuedAt)}</TableCell>
                                        <TableCell style={{fontSize: '0.875rem'}}>{formatDate(cert.expiresAt)}</TableCell>
                                        <TableCell style={{fontSize: '0.875rem'}}>{cert.issuedByNode || '-'}</TableCell>
                                        <TableCell>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <Button variant="secondary" size="sm" onClick={() => setSelectedCert(cert)}>View</Button>
                                                <Button variant="outline" size="sm" onClick={() => handleRenew(cert.id)} disabled={loading}>Renew</Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(cert.id)} disabled={loading}>Delete</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </TabsContent>

                <TabsContent value="upload" style={{paddingTop: '1rem'}}>
                    <form onSubmit={handleUpload} style={formStyle}>
                        <label style={labelStyle}>
                            Domains (one per line or semicolon-separated)
                            <Textarea
                                value={uploadDomains}
                                onChange={(e) => setUploadDomains(e.target.value)}
                                placeholder={'example.com\nwww.example.com'}
                                required
                                rows={3}
                            />
                        </label>
                        <label style={labelStyle}>
                            Certificate PEM
                            <Textarea
                                value={uploadCertPem}
                                onChange={(e) => setUploadCertPem(e.target.value)}
                                placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
                                required
                                rows={5}
                                style={{fontFamily: 'monospace', fontSize: '0.8125rem'}}
                            />
                        </label>
                        <label style={labelStyle}>
                            Private Key PEM
                            <Textarea
                                value={uploadKeyPem}
                                onChange={(e) => setUploadKeyPem(e.target.value)}
                                placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                                required
                                rows={5}
                                style={{fontFamily: 'monospace', fontSize: '0.8125rem'}}
                            />
                        </label>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Uploading...' : 'Upload Certificate'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setActiveTab('list')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="generate" style={{paddingTop: '1rem'}}>
                    <form onSubmit={handleGenerate} style={formStyle}>
                        <label style={labelStyle}>
                            Domains (one per line or semicolon-separated)
                            <Textarea
                                value={generateDomains}
                                onChange={(e) => setGenerateDomains(e.target.value)}
                                placeholder={'example.com\nwww.example.com'}
                                required
                                rows={3}
                            />
                        </label>
                        <p style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>
                            Note: Self-signed certificates are only suitable for development and testing.
                            Browsers will show security warnings for self-signed certificates.
                        </p>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Self-Signed Certificate'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setActiveTab('list')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            {/* Certificate detail Dialog */}
            <Dialog open={!!selectedCert} onOpenChange={(open) => { if (!open) setSelectedCert(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Certificate Details</DialogTitle>
                    </DialogHeader>
                    {selectedCert && (
                        <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', padding: '0.5rem 0', alignItems: 'start', fontSize: '0.875rem'}}>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>ID</dt>
                            <dd style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>{selectedCert.id}</dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Domains</dt>
                            <dd>
                                <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                                    {domainList(selectedCert.domains).map((domain, i) => (
                                        <li key={i}>{domain}</li>
                                    ))}
                                </ul>
                            </dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Status</dt>
                            <dd><Badge variant={getCertBadgeVariant(selectedCert)}>{getCertBadgeLabel(selectedCert)}</Badge></dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Issued At</dt>
                            <dd>{formatDate(selectedCert.issuedAt)}</dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Expires At</dt>
                            <dd>{formatDate(selectedCert.expiresAt)}</dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Last Used</dt>
                            <dd>{formatDate(selectedCert.lastUsedAt)}</dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Issued By Node</dt>
                            <dd>{selectedCert.issuedByNode || 'Unknown'}</dd>
                            {selectedCert.failureReason && (
                                <>
                                    <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Failure Reason</dt>
                                    <dd style={{color: 'var(--destructive)'}}>{selectedCert.failureReason}</dd>
                                </>
                            )}
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Failure Count</dt>
                            <dd>{selectedCert.failureCount}</dd>
                            <dt style={{color: 'var(--muted-foreground)', fontWeight: 500}}>Orphaned</dt>
                            <dd>{selectedCert.isOrphaned ? 'Yes' : 'No'}</dd>
                        </dl>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setSelectedCert(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {toast && (
                <div style={{position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999}}>
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius)',
                        background: toast.type === 'success' ? 'var(--primary)' : toast.type === 'error' ? 'var(--destructive)' : 'var(--muted)',
                        color: toast.type === 'success' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
