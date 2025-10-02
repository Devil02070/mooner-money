"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { H1, Label12, Label14, PMedium, XSMedium } from "@/components/ui/typography";
import { Config } from "@/providers/AppProvider"
import { useFormik } from "formik";
import { ArrowUpFromLine, Asterisk } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/providers/AppProvider";
import { swapExactAptosForTokens } from "@/lib/math";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { errorMessage } from "@/utils/errorMessage";
import { aptosClient, getMultipleFungibleAssetBalances, getTxnOnExplorer } from "@/lib/aptos";
import { createTokenSchema } from "@/utils/zodSchema";
import { handleDropFile } from "@/utils/s3-upload";
import { CA } from "@/lib/env";
import axios from "axios";
import { IoCheckmark } from "react-icons/io5";

interface LaunchProps {
    config: Config;
}

export function Launch({ config }: LaunchProps) {
    const { chainToken } = useApp();
    const { connected, account, signAndSubmitTransaction } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File>();
    const [tokenIcon, setTokenIcon] = useState<string>();
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreated, setIsCreated] = useState<string>()

    const getBalance = useCallback(async () => {
        try {
            if (!account?.address) throw new Error("Wallet not connected")
            const amounts = await getMultipleFungibleAssetBalances(
                account.address.toString(),
                [chainToken.fa_addr]
            );
            setBalance(amounts[0] / Math.pow(10, chainToken.decimals))
        } catch (error) {
            setBalance(0)
            console.log(`[error-launch-getBalance]: ${error}`)
        }
    }, [account]);

    const { handleSubmit, values, handleChange, errors, touched, setFieldValue, resetForm, setFieldError } = useFormik({
        initialValues: {
            name: "",
            symbol: "",
            image: false,
            description: "",
            initial_amount: null,
            website: null,
            twitter: null,
            telegram: null
        },
        validate: (values) => {
            const result = createTokenSchema.safeParse(values);
            if (!result.success) {
                return result.error.flatten().fieldErrors;
            }
            return {};
        },
        onSubmit: async (formdata) => {
            try {
                setIsLoading(true);
                if (!file) throw new Error("Image file not found");
                if (!account) throw new Error("Wallet not connected")
                const { imageUrl, presignedUrl } = await handleDropFile({
                    tokenAddress: `TOKEN-${formdata.symbol}-${Date.now()}`,
                    name: file.name,
                    size: file.size,
                    type: file.type
                }, file);

                let functionName = "create_entry";
                const functionArguments = [
                    formdata.name,
                    formdata.symbol,
                    imageUrl,
                    formdata.description,
                    formdata.website,
                    formdata.twitter,
                    formdata.telegram,
                ];

                if (formdata.initial_amount && !(isNaN(Number(formdata.initial_amount)))) {
                    const max_aptos = Math.ceil(Number(formdata.initial_amount) * Math.pow(10, chainToken.decimals));
                    const min_coins = swapExactAptosForTokens(
                        config.virtual_aptos_reserves,
                        config.supply * Math.pow(10, config.decimals),
                        max_aptos,
                        config.fee
                    );
                    functionArguments.push(max_aptos.toString());
                    functionArguments.push(Math.ceil(min_coins).toString());
                    functionName = "create_and_buy_entry"
                };

                const transaction: InputTransactionData = {
                    data: {
                        function: `${CA}::mooner_money::${functionName}`,
                        functionArguments
                    }
                };

                const response = await signAndSubmitTransaction(transaction);
                await aptosClient.waitForTransaction({ transactionHash: response.hash });
                await axios.put(presignedUrl, file, {
                    headers: {
                        "Content-Type": file.type
                    },
                    onUploadProgress: (progressEvent) => {
                        const precentCompleted = Math.round(
                            (progressEvent.loaded * 100) / file.size
                        );
                        console.log(precentCompleted)
                    }
                })
                resetForm()
                setFile(undefined)
                setTokenIcon(undefined)
                toast.success(`Transaction completed`, {
                    action: <a target="_blank" href={getTxnOnExplorer(response.hash)} style={{ color: "green", textDecoration: "underline" }}>View Txn</a>,
                    icon: <IoCheckmark />
                });
                const transactionResponse = await aptosClient.getTransactionByHash({ transactionHash: response.hash });
                if (transactionResponse.type === "user_transaction") {
                    const events = transactionResponse.events;
                    const tokenCreatedEvent = events.find((event) => event.type === `${CA}::mooner_money::TokenCreated`);
                    if (tokenCreatedEvent) {
                        const type = tokenCreatedEvent.data.pre_addr;
                        setIsCreated(type as string)
                    }
                }
            } catch (error) {
                toast.error(errorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
    });

    const handleFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (e.target.files) {
                const file = e.target.files[0];
                if (!file) throw new Error("File not uploaded")
                const validFormats = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
                const maxFileSize = 5 * 1024 * 1024;

                if (!validFormats.includes(file.type)) {
                    throw new Error("Only PNG, JPEG, WEBP and GIF files are supported.")
                }

                if (file.size > maxFileSize) {
                    throw new Error("File size must not exceed 5MB.")
                }

                const img = new window.Image();
                img.onload = () => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            setTokenIcon(e.target.result as string);
                            setFile(file)
                            setFieldValue("image", true)
                        }
                    };
                    reader.readAsDataURL(file);
                };

                img.onerror = (e) => {
                    throw new Error(e.toString());
                };

                img.src = URL.createObjectURL(file);

            }
        } catch (error) {
            setFile(undefined)
            setTokenIcon(undefined)
            setFieldValue("image", false)
            setFieldError("image", "Image is required");
            console.log(error)
        }
    }

    useEffect(() => {
        getBalance()
    }, [getBalance])


    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-5xl mb-20 md:mb-0 mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                    <div className="space-y-6 w-full">
                        <div className="space-y-3">
                            <Label14 className="flex gap-1 items-center">
                                Token name
                                <Asterisk size={14} className="text-danger" />
                            </Label14>
                            <Input
                                name="name"
                                placeholder="Enter token Name"
                                value={values.name}
                                onChange={handleChange}
                                className={errors.name && touched.name ? "border-danger" : ""}
                            />
                            {errors.name && touched.name && <Label12 className="text-danger">{errors.name}</Label12>}
                        </div>
                        <div className="space-y-3">
                            <Label14 className="flex gap-1 items-center">
                                Token symbol
                                <Asterisk size={14} className="text-danger" />
                            </Label14>
                            <Input
                                name="symbol"
                                placeholder="Enter token Symbol"
                                value={values.symbol}
                                onChange={(e) => setFieldValue("symbol", e.target.value.toUpperCase())}
                                className={errors.symbol && touched.symbol ? "border-danger" : ""}
                            />
                            {errors.symbol && touched.symbol && <Label12 className="text-danger">{errors.symbol}</Label12>}
                        </div>
                    </div>

                    {/* Upload Image */}
                    <div className="w-full space-y-3">
                        <Label14 className="flex gap-1 items-center">
                            Token Icon
                            <Asterisk size={14} className="text-danger" />
                        </Label14>
                        <div
                            className={`border-2 rounded-[12px] flex flex-col items-center space-y-2 w-full ${tokenIcon ? 'p-3' : 'p-4'} ${errors.image && touched.image ? "border-danger" : ""}`}
                            onClick={() => { handleFileUpload() }}>
                            {tokenIcon ? (
                                <div className="space-y-2 w-full">
                                    <Image
                                        src={tokenIcon}
                                        alt={values.symbol}
                                        height={100}
                                        width={100}
                                        className="object-cover rounded-md bg-card"
                                    />
                                </div>
                            ) : (
                                <>
                                    <Label12 className="text-muted">Click to upload</Label12>
                                    <Label12 className="text-muted">Supported formats: PNG, JPEG, JPG, Webp</Label12>
                                    <Label12 className="text-muted">Max file size: 5MB</Label12>
                                    <Button type="button" className="w-fit">
                                        Upload <ArrowUpFromLine className="ml-2" />
                                    </Button>
                                </>
                            )}

                            <input
                                ref={fileInputRef}
                                name="file"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={onFileChange}
                            />
                        </div>
                        {errors.image && touched.image && <Label12 className="text-danger">{errors.image}</Label12>}
                    </div>
                </div>

                <div className="space-y-8 w-full">
                    <div className="space-y-3">
                        <Label14 className="flex gap-1 items-center">
                            Token description
                            <Asterisk size={14} className="text-danger" />
                        </Label14>
                        <Textarea
                            name="description"
                            placeholder="Type description here..."
                            className={`resize-none h-36 scrollbar-hide ${errors.description && touched.description ? "border-danger" : ""}`}
                            value={values.description}
                            onChange={handleChange}
                            maxLength={250}
                        />
                        <div className="flex justify-between">
                            {errors.description && touched.description && <Label12 className="text-danger">{errors.description}</Label12>}
                            <Label12 className="text-muted ml-auto">{values.description.length}/250</Label12>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 w-full">
                    <div className="space-y-3">
                        <Label14 className="flex gap-1 items-center">Buy Initial Amount. (Opt.) || Bal. {balance} {chainToken.symbol}</Label14>
                        <Input
                            placeholder="Buy tokens initially APT"
                            type="text"
                            min="0"
                            step="0.01"
                            name="initial_amount"
                            value={values.initial_amount ?? ""}
                            onChange={handleChange}
                            className={errors.initial_amount && touched.initial_amount ? "border-danger" : ""}
                        />
                        {errors.initial_amount && touched.initial_amount && <Label12 className="text-danger">{errors.initial_amount}</Label12>}
                        <Label12 className="text-muted">
                            You will get: {values.initial_amount && !(isNaN(Number(values.initial_amount))) ? swapExactAptosForTokens(
                                config.virtual_aptos_reserves,
                                config.supply * Math.pow(10, config.decimals),
                                Number(values.initial_amount) * Math.pow(10, chainToken.decimals),
                                config.fee
                            ) / Math.pow(10, config.decimals) : "0.00"}
                        </Label12>
                    </div>
                </div>

                {/* Social Links */}
                <div className="p-3 bg-card rounded-[12px]">
                    <XSMedium>SOCIALS</XSMedium>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-3 w-full">
                            <Label14 className="flex gap-1 items-center">Twitter Link (Opt.)</Label14>
                            <Input
                                name="twitter"
                                placeholder="Eg. : https://x.com/example"
                                value={values.twitter ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    setFieldValue("twitter", val === "" ? null : val);
                                }}
                                className={errors.twitter && touched.twitter ? "border-danger" : ""}
                            />
                            {errors.twitter && touched.twitter && (
                                <Label12 className="text-danger">{errors.twitter}</Label12>
                            )}

                        </div>
                        <div className="space-y-3 w-full">
                            <Label14 className="flex gap-1 items-center">Telegram Link (Opt.)</Label14>
                            <Input
                                name="telegram"
                                placeholder="Eg. : https://t.me/example"
                                value={values.telegram ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    setFieldValue("telegram", val === "" ? null : val);
                                }}
                                className={errors.telegram && touched.telegram ? "border-danger" : ""}
                            />
                            {errors.telegram && touched.telegram && (
                                <Label12 className="text-danger">{errors.telegram}</Label12>
                            )}
                        </div>
                        <div className="space-y-3 w-full">
                            <Label14 className="flex gap-1 items-center">Website (Opt.)</Label14>
                            <Input
                                name="website"
                                placeholder="Eg. : https://example.com/"
                                value={values.website ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    setFieldValue("website", val === "" ? null : val);
                                }}
                                className={errors.website && touched.website ? "border-danger" : ""}
                            />
                            {errors.website && touched.website && (
                                <Label12 className="text-danger">{errors.website}</Label12>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Label14>
                        Deployment Fee: <span className="text-primary">{config.create_fee / Math.pow(10, chainToken.decimals)} {chainToken.symbol}</span>
                    </Label14>
                </div>

                <div className="grid grid-cols-2 w-full gap-3">
                    <Link prefetch href={"/"} className="w-full">
                        <Button type="button" variant="ghost" className="w-full md:w-1/2">
                            Go Back
                        </Button>
                    </Link>
                    {
                        !connected ? (
                            <WalletButton className="flex-1" />
                        ) : (
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Confirm Transaction..." : "Create Token"}
                            </Button>
                        )
                    }

                </div>
            </form>
            {/* {
                isLoading &&
                <div className="fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-black/90 z-90">
                    <div className='max-w-lg w-full mt-[10%] mx-auto '>
                        <div className="flex items-center justify-center bg-card p-4 rounded-2xl">
                            <div className="not-found text-center">
                                <H1>Launching Token</H1>
                                <PMedium className="mt-4">Waiting for transaction to confirm...</PMedium>
                            </div>
                        </div>
                    </div>
                </div>
            } */}

            {
                isCreated &&
                <div className="fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-black/90 z-90">
                    <div className="flex items-center justify-center bg-card w-fit m-auto p-4 rounded-2xl max-w-lg">
                        <div className="not-found text-center">
                            <H1>🎉 Token created successfully.</H1>
                            <PMedium className="mt-4">
                                Congrats, your shiny new token is all set! 🐾
                            </PMedium>
                            {/* <Image
                                src="/success.webp"
                                alt="success"
                                height={160}
                                width={150}
                                className="mt-8 mx-auto"
                            /> */}
                            <Button asChild className="btn-yellow rounded-pill mt-8">
                                <Link href={`/${isCreated}`}>See Your Token</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}