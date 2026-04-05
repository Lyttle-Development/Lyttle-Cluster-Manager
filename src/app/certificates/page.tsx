'use client';

import {useEffect, useMemo, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Container,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Empty,
    Field,
    Heading,
    Inline,
    Stack,
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
    Text,
    Textarea,
} from '@lyttle-development/ui';
import {FileKey2, RefreshCcw, ShieldCheck, Upload} from 'lucide-react';
import {toast} from 'sonner';

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

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
}

function domainList(domainsStr: string) {
    return domainsStr.split(';').map((domain) => domain.trim()).filter(Boolean);
}

function certificateStatusBadge(cert: Certificate) {
    const expiresAt = new Date(cert.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (cert.status === 'failed') {
        return <Badge variant="destructive">Failed</Badge>;
    }

    if (cert.status === 'pending') {
        return <Badge variant="warning">Pending</Badge>;
    }

    if (daysUntilExpiry < 0) {
        return <Badge variant="destructive">Expired</Badge>;
    }

    if (daysUntilExpiry < 14) {
        return <Badge variant="warning">Expires in {daysUntilExpiry}d</Badge>;
    }

    return <Badge variant="success">Active</Badge>;
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

    const refresh = async () => {
        try {
            const response = await fetch('/api/certificates', {cache: 'no-store'});

            if (!response.ok) {
                toast.error('Failed to load certificates');
                return;
            }

            setCertificates(await response.json());
        } catch (error) {
            console.error('Failed to load certificates:', error);
            toast.error('Failed to load certificates');
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const domains = uploadDomains.split(/[;,\n]/).map((domain) => domain.trim()).filter(Boolean);
            const response = await fetch('/api/certificates/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({domains, certPem: uploadCertPem, keyPem: uploadKeyPem}),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => null);
                toast.error(error?.message || 'Upload failed');
                return;
            }

            toast.success('Certificate uploaded successfully');
            setUploadDomains('');
            setUploadCertPem('');
            setUploadKeyPem('');
            setActiveTab('list');
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const domains = generateDomains.split(/[;,\n]/).map((domain) => domain.trim()).filter(Boolean);
            const response = await fetch('/api/certificates/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({domains}),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => null);
                toast.error(error?.message || 'Generation failed');
                return;
            }

            toast.success('Self-signed certificate generated successfully');
            setGenerateDomains('');
            setActiveTab('list');
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/certificates/${id}`, {method: 'DELETE'});

            if (!response.ok) {
                toast.error('Failed to delete certificate');
                return;
            }

            toast.success('Certificate deleted successfully');
            setSelectedCert((current) => (current?.id === id ? null : current));
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete certificate');
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async (id: string) => {
        setLoading(true);

        try {
            const response = await fetch(`/api/certificates/${id}/renew`, {method: 'POST'});

            if (!response.ok) {
                toast.error('Failed to renew certificate');
                return;
            }

            toast.success('Certificate renewal initiated');
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to renew certificate');
        } finally {
            setLoading(false);
        }
    };

    const sortedCertificates = useMemo(
        () => [...certificates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [certificates],
    );

    return (
        <Container size="7xl" padding="lg">
            <Stack gap="lg" align="start">
                <Stack gap="xs" align="start">
                    <Heading size="3xl">SSL certificates</Heading>
                    <Text tone="muted">
                        Review managed certificates, upload custom PEM assets, or generate development-only self-signed certificates.
                    </Text>
                </Stack>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} style={{width: '100%'}}>
                    <TabsList variant="line" aria-label="Certificate management views">
                        <TabsTrigger value="list">Certificates ({certificates.length})</TabsTrigger>
                        <TabsTrigger value="upload">Upload certificate</TabsTrigger>
                        <TabsTrigger value="generate">Generate self-signed</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" style={{marginTop: '1rem', width: '100%'}}>
                        {sortedCertificates.length === 0 ? (
                            <Empty
                                title="No certificates found"
                                description="Upload your first PEM certificate or generate a self-signed certificate to get started."
                                icon={<ShieldCheck size={36} aria-hidden="true"/>}
                            >
                                <Button variant="brand" onClick={() => setActiveTab('upload')}>
                                    <Upload size={16} aria-hidden="true"/>
                                    Upload your first certificate
                                </Button>
                            </Empty>
                        ) : (
                            <Card style={{width: '100%'}}>
                                <CardHeader>
                                    <Inline justify="between" gap="md">
                                        <Stack gap="xs" align="start">
                                            <CardTitle>Managed certificates</CardTitle>
                                            <CardDescription>Newest certificates appear first.</CardDescription>
                                        </Stack>
                                        <Button variant="secondary" onClick={refresh}>
                                            <RefreshCcw size={16} aria-hidden="true"/>
                                            Refresh
                                        </Button>
                                    </Inline>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Domains</TableHead>
                                                <TableHead>Issued</TableHead>
                                                <TableHead>Expires</TableHead>
                                                <TableHead>Issued by</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedCertificates.map((cert) => (
                                                <TableRow key={cert.id}>
                                                    <TableCell>{certificateStatusBadge(cert)}</TableCell>
                                                    <TableCell>
                                                        <Inline gap="xs">
                                                            {domainList(cert.domains).map((domain) => (
                                                                <Badge key={domain} variant="outline">{domain}</Badge>
                                                            ))}
                                                        </Inline>
                                                    </TableCell>
                                                    <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                                                    <TableCell>{formatDate(cert.expiresAt)}</TableCell>
                                                    <TableCell>{cert.issuedByNode || '-'}</TableCell>
                                                    <TableCell>
                                                        <Inline gap="xs">
                                                            <Button variant="outline" size="sm" onClick={() => setSelectedCert(cert)}>
                                                                View
                                                            </Button>
                                                            <Button size="sm" onClick={() => handleRenew(cert.id)} disabled={loading}>
                                                                Renew
                                                            </Button>
                                                            <Button variant="danger" size="sm" onClick={() => handleDelete(cert.id)} disabled={loading}>
                                                                Delete
                                                            </Button>
                                                        </Inline>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="upload" style={{marginTop: '1rem', width: '100%'}}>
                        <Card style={{width: '100%'}}>
                            <CardHeader>
                                <CardTitle>Upload certificate</CardTitle>
                                <CardDescription>Paste PEM-encoded certificate and private key material for the listed domains.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpload}>
                                    <Stack gap="md" align="start">
                                        <Field
                                            label="Domains"
                                            htmlFor="upload-domains"
                                            description="One domain per line, or separate entries with semicolons."
                                            required
                                        >
                                            <Textarea
                                                id="upload-domains"
                                                value={uploadDomains}
                                                onChange={(event) => setUploadDomains(event.target.value)}
                                                placeholder={'example.com\nwww.example.com'}
                                                rows={4}
                                                required
                                            />
                                        </Field>

                                        <Field label="Certificate PEM" htmlFor="upload-cert" required>
                                            <Textarea
                                                id="upload-cert"
                                                value={uploadCertPem}
                                                onChange={(event) => setUploadCertPem(event.target.value)}
                                                placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
                                                rows={8}
                                                required
                                            />
                                        </Field>

                                        <Field label="Private key PEM" htmlFor="upload-key" required>
                                            <Textarea
                                                id="upload-key"
                                                value={uploadKeyPem}
                                                onChange={(event) => setUploadKeyPem(event.target.value)}
                                                placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                                                rows={8}
                                                required
                                            />
                                        </Field>

                                        <Inline gap="sm">
                                            <Button type="submit" variant="brand" disabled={loading}>
                                                <Upload size={16} aria-hidden="true"/>
                                                {loading ? 'Uploading...' : 'Upload certificate'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                                                Cancel
                                            </Button>
                                        </Inline>
                                    </Stack>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="generate" style={{marginTop: '1rem', width: '100%'}}>
                        <Card style={{width: '100%'}}>
                            <CardHeader>
                                <CardTitle>Generate self-signed certificate</CardTitle>
                                <CardDescription>Best for development and testing only; browsers will show trust warnings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGenerate}>
                                    <Stack gap="md" align="start">
                                        <Field
                                            label="Domains"
                                            htmlFor="generate-domains"
                                            description="One domain per line, or separate entries with semicolons."
                                            required
                                        >
                                            <Textarea
                                                id="generate-domains"
                                                value={generateDomains}
                                                onChange={(event) => setGenerateDomains(event.target.value)}
                                                placeholder={'example.com\nwww.example.com'}
                                                rows={4}
                                                required
                                            />
                                        </Field>

                                        <Text size="sm" tone="muted">
                                            Self-signed certificates are intended for development flows and internal validation only.
                                        </Text>

                                        <Inline gap="sm">
                                            <Button type="submit" disabled={loading}>
                                                <FileKey2 size={16} aria-hidden="true"/>
                                                {loading ? 'Generating...' : 'Generate self-signed certificate'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                                                Cancel
                                            </Button>
                                        </Inline>
                                    </Stack>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={Boolean(selectedCert)} onOpenChange={(open) => !open && setSelectedCert(null)}>
                    {selectedCert && (
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Certificate details</DialogTitle>
                                <DialogDescription>
                                    Review metadata, expiry dates, and any recorded failure state for this certificate.
                                </DialogDescription>
                            </DialogHeader>

                            <Stack gap="md" align="start">
                                <Stack gap="sm" align="start" style={{width: '100%'}}>
                                    {[
                                        {label: 'ID', value: selectedCert.id, mono: true},
                                        {label: 'Status', value: certificateStatusBadge(selectedCert)},
                                        {label: 'Issued at', value: formatDate(selectedCert.issuedAt)},
                                        {label: 'Expires at', value: formatDate(selectedCert.expiresAt)},
                                        {label: 'Last used', value: formatDate(selectedCert.lastUsedAt)},
                                        {label: 'Issued by node', value: selectedCert.issuedByNode || 'Unknown'},
                                        {label: 'Failure count', value: selectedCert.failureCount},
                                        {label: 'Orphaned', value: selectedCert.isOrphaned ? 'Yes' : 'No'},
                                    ].map((item) => (
                                        <Card key={item.label} size="sm" style={{width: '100%'}}>
                                            <CardContent>
                                                <Stack gap="xs" align="start">
                                                    <Text size="xs" tone="muted" transform="uppercase">{item.label}</Text>
                                                    {typeof item.value === 'string' || typeof item.value === 'number'
                                                        ? <Text mono={item.mono} size="sm">{item.value}</Text>
                                                        : item.value}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>

                                <Stack gap="xs" align="start">
                                    <Text size="xs" tone="muted" transform="uppercase">Domains</Text>
                                    <Inline gap="xs">
                                        {domainList(selectedCert.domains).map((domain) => (
                                            <Badge key={domain} variant="outline">{domain}</Badge>
                                        ))}
                                    </Inline>
                                </Stack>

                                {selectedCert.failureReason && (
                                    <Card style={{width: '100%'}}>
                                        <CardHeader>
                                            <CardTitle>Failure reason</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Text tone="default">{selectedCert.failureReason}</Text>
                                        </CardContent>
                                    </Card>
                                )}
                            </Stack>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedCert(null)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </Stack>
        </Container>
    );
}

