import {useEffect, useRef, useState} from 'react';
import {NodeResponse} from '@/app/api/node/route';

export interface UseNodeResult {
    node: NodeResponse | null;
    cachedNode: NodeResponse | null;
    status: string;
    sendCommand: (command: string, customStatus?: string) => Promise<void>;
    setStatus: (status: string) => void;
}

/**
 * useNode
 * - Polls node data with correct reload/interval logic (no excessive requests).
 * - Uniform command interface with status cooldown.
 * - Correctly differentiates between 'loading' (first load) and 'reloading' (subsequent fetches).
 * - Idiomatic TypeScript, React, and error handling.
 */
export function useNode(host: string): UseNodeResult {
    const [node, setNode] = useState<NodeResponse | null>(null);
    const [cachedNode, setCachedNode] = useState<NodeResponse | null>(null);
    const [status, setStatusInternal] = useState<string>('loading');

    const STATUS_MIN_DURATION_MS = 2 * 1000; // Minimum duration for status to be displayed
    const POLL_INTERVAL_MS = STATUS_MIN_DURATION_MS * 2; // Polling interval for node data
    const statusTimestampRef = useRef<number>(Date.now());
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstLoad = useRef<boolean>(true);

    /**
     * Sets status with a minimum duration before next status change.
     */
    const setStatus = (nextStatus: string) => {
        const now = Date.now();
        const elapsed = now - statusTimestampRef.current;
        if (elapsed < STATUS_MIN_DURATION_MS) {
            setTimeout(() => {
                setStatusInternal(nextStatus);
                statusTimestampRef.current = Date.now();
            }, STATUS_MIN_DURATION_MS - elapsed);
        } else {
            setStatusInternal(nextStatus);
            statusTimestampRef.current = Date.now();
        }
    };

    /**
     * Fetches node data and applies cooldown on status if needed.
     * Handles 'loading' for first load, 'reloading' for subsequent loads.
     */
    const fetchNodeData = async () => {
        try {
            if (isFirstLoad.current) {
                setStatus('loading');
            } else {
                setStatus('reloading');
            }
            const response = await fetch(`/api/node/${host}`);
            if (!response.ok) throw new Error(`Failed to fetch data for host: ${host}`);
            const data: NodeResponse = await response.json();
            setNode(data);
            if (data) setCachedNode(data);
            setStatus(data ? 'running' : 'offline');
        } catch (error) {
            setNode(null);
            setStatus('offline');

            console.error('Error fetching node data:', error);
        } finally {
            isFirstLoad.current = false;
        }
    };

    // Polling logic: Only one request per interval, reset on host change.
    useEffect(() => {
        let mounted = true;
        isFirstLoad.current = true;

        const poll = async () => {
            if (!mounted) return;
            await fetchNodeData();
            pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        };

        fetchNodeData();
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);

        return () => {
            mounted = false;
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };

    }, [host]);

    /**
     * sendCommand
     * - Sends a command, sets custom status, ensures cooldown.
     */
    const sendCommand = async (command: string, customStatus?: string) => {
        if (!node) return;
        const confirmed = window.confirm(`Are you sure you want to execute "${command}" on ${node.hostname}?`);
        if (!confirmed) return;
        try {
            setStatus(customStatus || command);
            const cmdStart = Date.now();
            const response = await fetch(
                `/api/command/${host}?command=${encodeURIComponent(command)}`,
                {method: 'GET'}
            );
            if (!response.ok) throw new Error(`Failed to execute command "${command}" on node: ${node.hostname}`);
            const cmdEnd = Date.now();
            const elapsed = cmdEnd - cmdStart;
            if (elapsed < STATUS_MIN_DURATION_MS) {
                await new Promise(res => setTimeout(res, STATUS_MIN_DURATION_MS - elapsed));
            }
            setNode(null);
        } catch (error) {

            console.error(`Error executing command "${command}":`, error);
            alert(`Failed to execute "${command}" on node. Please try again later.`);
        }
    };

    return {node, cachedNode, status, sendCommand, setStatus};
}