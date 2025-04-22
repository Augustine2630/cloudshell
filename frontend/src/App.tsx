import './App.css'
import { useEffect, useState } from 'react'
import HostListComponent from './component/HostListComponent'
import TerminalComponent from './component/TerminalComponent'

declare global {
    interface Window {
        Telegram: any;
    }
}

function App() {
    const [selectedHostIp, setSelectedHostIp] = useState<string | null>(null)
    const [isAuthenticated, setAuthenticated] = useState<boolean>(false)
    const [, setUserData] = useState<any>(null)

    useEffect(() => {
        const tg = window.Telegram?.WebApp
        if (tg) {
            const userId = tg.initDataUnsafe?.user?.id

            if (!userId) {
                setAuthenticated(true)
                return
            }

            // Проверка по API
            fetch(`https://inner.barsic.online/v1/auth/bool?clientId=${userId}`)
                .then(res => res.json())
                .then((data: boolean) => {
                    if (data) {
                        setAuthenticated(true)
                        setUserData(tg.initDataUnsafe.user)
                    } else {
                        alert("Доступ запрещён")
                    }
                })
                .catch(err => {
                    console.error("Ошибка запроса авторизации:", err)
                    alert("Ошибка соединения с сервером")
                })
        } else {
            alert("Telegram WebApp не найден")
        }
    }, [])

    if (!isAuthenticated) {
        return <div>Загрузка авторизации через Telegram...</div>
    }

    return (
        <>
            {selectedHostIp ? (
                <TerminalComponent ip={selectedHostIp} />
            ) : (
                <HostListComponent onSelectHost={(ip: string) => setSelectedHostIp(ip)} />
            )}
        </>
    )
}

export default App
