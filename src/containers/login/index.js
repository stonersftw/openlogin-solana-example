import React, { useEffect, useState } from "react";
import OpenLogin from "openlogin";
import AccountInfo  from "../../components/AccountInfo";
import { Account, Connection, clusterApiUrl } from "@solana/web3.js";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import * as bs58 from "bs58";
import { useHistory } from "react-router-dom"

import "./style.scss";

const networks = {
  mainnet: { url: "https://api.mainnet-beta.solana.com", displayName: "Mainnet Beta" },
  devnet: { url: "https://api.devnet.solana.com", displayName: "Devnet" },
  testnet: { url: "https://api.testnet.solana.com", displayName: "Testnet" },
};

const solanaNetwork = networks.mainnet;
const connection = new Connection(solanaNetwork.url);

function Login() {

  const [loading, setLoading] = useState(false);
  const [openlogin, setSdk] = useState(undefined);
  const [account, setUserAccount] = useState(null);
  const [walletInfo, setUserAccountInfo] = useState(null);
  const [solanaPrivateKey, setPrivateKey] = useState(null)
  const [torusNetwork, setTorusNetwork] = useState(null)
  useEffect(() => {
    const defaultNetwork = localStorage.getItem('network') || 'testnet'
    setTorusNetwork(defaultNetwork)
  },[])
  useEffect(() => {
    setLoading(true);
    async function initializeOpenlogin() {
      const sdkInstance = new OpenLogin({
        clientId: process.env.REACT_APP_CLIENT_ID, // your project id
        network: localStorage.getItem('network') || 'testnet',
      });
      await sdkInstance.init();
      if (sdkInstance.privKey) {
        const userInfo = await sdkInstance.getUserInfo()
        console.log('user info', userInfo)

        const privateKey = sdkInstance.privKey;
        const secretKey = getSolanaPrivateKey(privateKey);
        await getAccountInfo(secretKey);
      }
      setSdk(sdkInstance);
      setLoading(false);
    }
    initializeOpenlogin();
  }, [torusNetwork]);


  const getSolanaPrivateKey = (openloginKey)=>{
    const  { sk } = getED25519Key(openloginKey);
    return sk;
  }

  const getAccountInfo = async(secretKey) => {
    const account = new Account(secretKey);
    const accountInfo = await connection.getAccountInfo(account.publicKey);
    setPrivateKey(bs58.encode(account.secretKey));
    setUserAccount(account);
    setUserAccountInfo(accountInfo);
    return accountInfo;
  }

  async function handleLogin() {
    setLoading(true)
    try {
      const privKey = await openlogin.login({
        redirectUrl: `${window.origin}`,
        relogin: true
      });
      if(privKey && typeof privKey === "string") {
        const userInfo = await openlogin.getUserInfo()
        console.log('user info', userInfo)
        const solanaPrivateKey = getSolanaPrivateKey(privKey);
        await getAccountInfo(solanaNetwork.url,solanaPrivateKey);
      } 
    
      setLoading(false)
    } catch (error) {
      console.log("error", error);
      setLoading(false)
    }
  }

  const handleLogout = async (fastLogin=false) => {
    setLoading(true)
    await openlogin.logout({
       fastLogin
    });
    setLoading(false)
  };

  const onChangeTorusNetwork = async (e)=>{
    console.log("vla", e.target.value)
    localStorage.setItem('network',e.target.value)
    setTorusNetwork(e.target.value)
    await openlogin._cleanup()

  }
  return (
    <>
    {
    loading ?
      <div>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", justifyContent: "center", alignItems: "center", margin: 20 }}>
              <h1>....loading</h1>
          </div>
      </div> :
      <div>
        {
          (openlogin && openlogin.privKey) ?
            <AccountInfo
              handleLogout={handleLogout}
              loading={loading}
              privKey={solanaPrivateKey}
              walletInfo={walletInfo}
              account={account}
            /> :
            <div className="loginContainer">
                <h1 style={{ textAlign: "center" }}>Openlogin x Solana</h1>
                <div onClick={handleLogin} className="btn">
                  Login
                </div>
                <select value={torusNetwork} onChange={onChangeTorusNetwork} style={{ margin: 20 }}>
                  <option id="mainnet">mainnet</option>
                  <option id="testnet">testnet</option>
                </select>
            </div>
        }

      </div>
    }
    </>
  );
}

export default Login;
