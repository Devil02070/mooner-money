"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Chat, Token } from "@/types/custom"
import { shortenAddress } from "@/utils/shortenAddress"
import { useRef, useState, useEffect, Dispatch, SetStateAction } from "react"
import { CiCirclePlus } from "react-icons/ci"
import { IoMdSend } from "react-icons/io"
import { BsEmojiSmile } from "react-icons/bs"
import dayjs from "dayjs"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { useApp } from "@/providers/AppProvider"
import Api from "@/lib/api"
import { handleDropFile } from "@/utils/s3-upload"
import axios from "axios"
import { toast } from "sonner"
import { errorMessage } from "@/utils/errorMessage"
import { Pagination } from "@/components/Pagination"
import EmojiPicker, { type EmojiClickData, type Theme } from "emoji-picker-react"
import { createPortal } from "react-dom"
import { VscAttach } from "react-icons/vsc";
import Image from "next/image"
import Empty from "@/components/Empty/Empty"

interface ChatProps {
    data: Chat[];
    token: Token;
    offset: number;
    count: number;
    setOffset: Dispatch<SetStateAction<number>>;
    authToken?: string;
}

export function ChatContainer({ data, token, offset, count, setOffset, authToken }: ChatProps) {
    const { connected } = useWallet()
    const { onSignIn, isSigningIn } = useApp()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [content, setContent] = useState("")
    const [file, setFile] = useState<File>()
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [portalMounted, setPortalMounted] = useState(false)
    const [pickerCoords, setPickerCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
    const emojiButtonRef = useRef<HTMLDivElement>(null)
    const pickerPortalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setPortalMounted(true)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            const clickedButton = emojiButtonRef.current?.contains(target)
            const clickedPortal = pickerPortalRef.current?.contains(target)
            if (clickedButton || clickedPortal) return
            setShowEmojiPicker(false)
        }

        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showEmojiPicker])

    useEffect(() => {
        if (!showEmojiPicker) return
        const recalc = () => calculatePickerPosition()
        window.addEventListener("resize", recalc)
        window.addEventListener("scroll", recalc, true)
        return () => {
            window.removeEventListener("resize", recalc)
            window.removeEventListener("scroll", recalc, true)
        }
    }, [showEmojiPicker])

    const calculatePickerPosition = () => {
        if (!emojiButtonRef.current) return

        const buttonRect = emojiButtonRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const pickerHeight = 400
        const pickerWidth = 300

        let top = buttonRect.bottom + 8
        if (top + pickerHeight > viewportHeight) {
            top = Math.max(8, buttonRect.top - pickerHeight - 8)
        }

        let left = buttonRect.right - pickerWidth
        left = Math.max(8, Math.min(left, viewportWidth - pickerWidth - 8))

        setPickerCoords({ top, left })
    }

    const onSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!authToken) {
                const token = await onSignIn()
                if (!token) return
                authToken = token
            }

            if (!content.trim()) {
                throw new Error("Please write some content")
            }
            const data: { content: string; image?: string } = {
                content,
            }
            let cloudflareUrl: string | undefined
            if (file) {
                const { imageUrl, presignedUrl } = await handleDropFile(
                    {
                        tokenAddress: `CHAT-${token.pre_addr}-${Date.now()}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    },
                    file,
                )
                data.image = imageUrl
                cloudflareUrl = presignedUrl
            }
            await Api.sendBackendRequest(`/api/chat/create/${token.pre_addr}`, "POST", JSON.stringify(data), authToken)
            if (cloudflareUrl && file) {
                await axios.put(cloudflareUrl, file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                    onUploadProgress: (progressEvent) => {
                        const precentCompleted = Math.round((progressEvent.loaded * 100) / file.size)
                        console.log(precentCompleted)
                    },
                })
            }
            setFile(undefined)
            setContent("")
            setShowEmojiPicker(false)
        } catch (error) {
            toast.error(errorMessage(error))
            console.log(`[error-chat-onSend]: ${error}`)
        }
    }

    const onEmojiClick = (emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji
        setContent((prev) => prev + emoji)

        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    const handleEmojiToggle = () => {
        if (!showEmojiPicker) {
            calculatePickerPosition()
        }
        setShowEmojiPicker((prev) => !prev)
    }

    const handleFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (e.target.files) {
                const file = e.target.files[0]
                if (!file) throw new Error("File not uploaded")
                const validFormats = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
                const maxFileSize = 5 * 1024 * 1024

                if (!validFormats.includes(file.type)) {
                    throw new Error("Only PNG, JPEG, WEBP and GIF files are supported.")
                }

                if (file.size > maxFileSize) {
                    throw new Error("File size must not exceed 5MB.")
                }

                const img = new window.Image()
                img.onload = () => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            setFile(file)
                        }
                    }
                    reader.readAsDataURL(file)
                }

                img.onerror = (e) => {
                    throw new Error(e.toString())
                }

                img.src = URL.createObjectURL(file)
            }
        } catch (error) {
            setFile(undefined)
            console.log(`[error-chat-onFileChange]: ${error}`)
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={onSend} className="relative w-full ">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={"Type a message..."}
                    className="p-5 w-full "
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="absolute flex border-l-2 pl-4 items-center gap-2 right-3 top-1/2  transform -translate-y-1/2 text-gray-400">
                    {
                        file ? (<VscAttach className="text-primary size-6 cursor-pointer" onClick={() => handleFileUpload()} />) : (<><CiCirclePlus className="text-primary size-6 cursor-pointer" onClick={() => handleFileUpload()} /></>)
                    }

                    <div className="relative" ref={emojiButtonRef}>
                        <BsEmojiSmile
                            className="text-primary size-5 cursor-pointer hover:text-primary/80 transition-colors"
                            onClick={handleEmojiToggle}
                        />
                    </div>
                    <Input type="file" hidden onChange={onFileChange} ref={fileInputRef} />
                    <Button type="submit" size={"icon"} className="h-[32px] w-[32px]" disabled={!connected || isSigningIn}>
                        <IoMdSend />
                    </Button>
                </div>
            </form>
            <div className="">
                <div className="space-y-6 mb-6">
                    {data.length === 0 ? (
                        <Empty title="No messages yet" description="No messages yet. Start the conversation!" />
                    ) : (
                        data.map((chat, index) => {
                            return (
                                <div
                                    key={chat.id}
                                    className="relative"
                                    style={{
                                        animationName: "slideInUp",
                                        animationDuration: "0.4s",
                                        animationTimingFunction: "ease-out",
                                        animationFillMode: "forwards",
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        className="absolute -bottom-[4px] -left-[5px] rotate-300"
                                        fill="#121212"
                                        style={{
                                            transitionProperty: "scale, fill",
                                            transitionDuration: "300ms",
                                            transitionTimingFunction: "cubic-bezier(0.31, 0.1, 0.08, 0.96)",
                                            transitionDelay: "0ms",
                                            willChange: "fill",
                                        }}
                                    >
                                        <path d="M-2.70729e-07 6.19355C8 6.19355 12 4.12903 16 6.99382e-07C16 6.70968 16 13.5 10 16L-2.70729e-07 6.19355Z"></path>
                                    </svg>

                                    <div className="bg-card rounded-2xl p-4 group relative ">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <span className={`text-sm font-medium text-[#FF00B4]`}>
                                                    {chat.user?.username ? chat.user.username : shortenAddress(chat.address)}
                                                </span>
                                                <span className="text-gray-400 text-xs font-mono">{dayjs(chat.timestamp).format()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {
                                                chat.image ? <div className="border rounded-xl overflow-hidden">
                                                    <Image src={chat.image} height={100} width={100} alt="" />
                                                </div> : <></>
                                            }
                                            <p className="text-foreground font-semibold">{chat.content}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
                <Pagination count={count} offset={offset} setOffset={setOffset} loading={false} />
            </div>

            {portalMounted &&
                showEmojiPicker &&
                createPortal(
                    <div
                        ref={pickerPortalRef}
                        style={{
                            position: "fixed",
                            top: pickerCoords.top,
                            left: pickerCoords.left,
                            zIndex: 2147483647, // on top of everything
                        }}
                        aria-label="Emoji picker"
                    >
                        <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} theme={"dark" as Theme} width={300} height={400} />
                    </div>,
                    document.body,
                )}

            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
