import React, { useEffect, useState } from 'react'
import styles from './HostListComponent.module.css'

interface Host {
    id: number
    name: string
    ip: string
    status: string
}

const initialHosts: Omit<Host, 'status'>[] = [
    { id: 1, name: 'Server-fin', ip: '104.164.54.137' },
    { id: 2, name: 'Server-usa', ip: 'abobus.tech' },
]

interface Props {
    onSelectHost: (ip: string) => void
}

const HostListComponent: React.FC<Props> = ({ onSelectHost }) => {
    const [hosts, setHosts] = useState<Host[]>(
        initialHosts.map((host) => ({ ...host, status: 'loading' }))
    )

    useEffect(() => {
        const fetchStatuses = async () => {
            const updatedHosts = await Promise.all(
                hosts.map(async (host) => {
                    try {
                        const res = await fetch(`https://${host.ip}/live`, { method: 'GET' })
                        const status = res.ok ? 'online' : 'offline'
                        return { ...host, status }
                    } catch {
                        return { ...host, status: 'offline' }
                    }
                })
            )
            setHosts(updatedHosts)
        }

        fetchStatuses()
    }, [])

    return (
        <div className={styles.hostList}>
            <h2>Список хостов</h2>
            {hosts.map((host) => (
                <div
                    className={styles.hostCard}
                    key={host.id}
                    onClick={() => host.status === 'online' && onSelectHost(host.ip)}
                    style={{ cursor: host.status === 'online' ? 'pointer' : 'default', opacity: host.status === 'online' ? 1 : 0.6 }}
                >
                    <div><strong>{host.name}</strong></div>
                    <div>{host.ip}</div>
                    <div
                        className={`${styles.hostStatus} ${
                            host.status === 'online'
                                ? styles.statusOnline
                                : host.status === 'offline'
                                    ? styles.statusOffline
                                    : styles.statusLoading
                        }`}
                    >
                        {host.status}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default HostListComponent
