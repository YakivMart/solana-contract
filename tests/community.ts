import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Community } from "../target/types/community";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda,
} from "@metaplex-foundation/js"
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata"
import * as fs from "fs"

import { createNewMint } from "../libs/createMint";
import { createTokenMetadata , uploadTokenMetadata } from "../libs/uploadTokenMetadata";
import { createTokenAccount } from "../libs/createTokenAccount";
import { mintToken } from "../libs/mintToken";
import { burnToken } from "../libs/burnToken";
import { transferToken } from "../libs/transferToken";


describe("community", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Community as Program<Community>;
  let connection = provider.connection; 
  var mint ;//= new anchor.web3.PublicKey("2UiH979Y8D76PhsXJihnL7AEZtvhaf2zwi9nqNRSXykV");
  let user = provider.wallet.payer;
  let murat = new anchor.web3.PublicKey("LPXpLwQ3mZNdxqDCqNWdoXRTbqMLkEhjEBWAq32aepY")
  // seed is 32 bytes  Uint8Array from derived "community"
  const community_wallet_keypair = anchor.web3.Keypair.generate();
  let custom_member_token_account;
  // .fromSecretKey(
  //   new Uint8Array([
  //     54, 218, 16, 158, 195, 144, 245, 39, 55, 157, 193,
  //     70, 218, 163, 200, 168, 223, 90, 198, 53, 225, 194,
  //     21, 111, 21, 77, 68, 69, 11, 186, 86, 194, 248,
  //     196, 58, 57, 48, 160, 124, 74, 98, 65, 225, 141,
  //     231, 77, 216, 166, 0, 218, 232, 177, 107, 220, 210,
  //     251, 24, 183, 1, 39, 224, 157, 65, 18
  //   ])
  // );
  // console.log("community_wallet_keypair", community_wallet_keypair.secretKey);

  let community_wallet = new anchor.Wallet(community_wallet_keypair);
  // .fromSeed(
  //   anchor.utils.bytes.utf8.encode("community").slice(0, 32)
  // );




  const community = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('community'),
      anchor.utils.bytes.utf8.encode('new_community'),
      new anchor.BN(2).toArrayLike(Buffer, "le", 8),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  )[0]

  const community_member_account_owner = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('community_member'),
      community.toBuffer(),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  )[0]

  const owner_state = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('user_state'),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  )[0]




  const custom_member = anchor.web3.Keypair.generate();
  // .fromSecretKey(
  //   new Uint8Array([
  //     180, 228, 5, 132, 87, 26, 238, 86, 166, 210, 179,
  //     55, 217, 218, 159, 40, 126, 234, 107, 101, 66, 213,
  //     14, 182, 8, 216, 140, 162, 134, 205, 255, 228, 247,
  //     61, 57, 103, 49, 152, 151, 253, 52, 11, 103, 252,
  //     103, 144, 92, 213, 173, 11, 137, 36, 47, 227, 254,
  //     213, 109, 54, 201, 75, 202, 158, 79, 1
  //   ])
  // );
  //.fromSeed([anchor.utils.bytes.utf8.encode('custom_member')].slice(0, 32));
  // console.log("custom_member", custom_member.secretKey);

  const custom_member_public_key = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('community_member'),
      community.toBuffer(),
      custom_member.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const custom_member_state = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('user_state'),
      custom_member.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  let metaplex = Metaplex.make(connection)
  .use(keypairIdentity(user))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  )

  const community_product_PDA = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('community_product'),
      community.toBuffer(),
      new anchor.BN(2).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0]

  it ("create owner state"  , async () => {
 
    try {
      
    
      const txx = await program.methods.createUserState().accounts(
        {
          owner: provider.wallet.publicKey,
          userState: owner_state,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      )
      .rpc();
      } catch (error) {
        if (!error.message.includes("UserStateAlreadyInitialized")) {
          console.log("owner",error);
        }
        }
  })
  
  it ("custom member state"  , async () => {

    try {
      let custom_member_balance = await connection.getBalance(custom_member.publicKey);

      let i = custom_member_balance;
    while (i < 6 * anchor.web3.LAMPORTS_PER_SOL) {
      let airdrop = connection.requestAirdrop(custom_member.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
        .then((res) => {
          console.log("Airdrop successful");
        }).catch((err) => {
          console.log("Airdrop failed");
        });      i += 2 * anchor.web3.LAMPORTS_PER_SOL;
        // 1 saniye bekle
        await new Promise(r => setTimeout(r, 10000));
      }
    
      const txx = await program.methods.createUserState().accounts(
        {
          owner: custom_member.publicKey,
          userState: custom_member_state,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      ).signers([custom_member])
      .rpc();
      } catch (error) {
        if (!error.message.includes("UserStateAlreadyInitialized")) {
          console.log("custom",error);
        }
          
        }
  })


  it("Is initialized!", async () => {
    // Add your test here.

    // Bir Community oluşturuyoruz.

    const tx = await program.methods.
      createCommunity(
        "new_community",
        new anchor.BN(2),
        community_wallet.publicKey,
        "https://arweave.net/e_s6UUVQXtfyy91R0joZxhc7Di7xzxOHGSPLGpgwu_Q",
        "Monkey Guild",
      ).accounts(
        {
          communityAccount: community,
          userState: owner_state,
          communityOwner: provider.wallet.publicKey,
          communityMember: community_member_account_owner,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      ).rpc();
    console.log("Your transaction signature", tx);
  });


  it("add_moderator", async () => {

    // Önce kullanıcının state'ini oluşturuyoruz.
    // Olusturulan community'ye moderator ekliyoruz.
    // Bu fonksiyon public key'i verilen kullanıcı için community account oluşturur (PDA)

    // Aynı kullanıcıya daha önce state oluşturduğumdan bu adımı atladım

    // const txx = await program.methods.createUserState().accounts(
    //   {
    //     owner: provider.wallet.publicKey,
    //     userState: owner_state,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   }
    // )
    // .rpc();

    try {
      
    const tx = await program.methods.
      addModerator(
        provider.wallet.publicKey,
      ).accounts(
        {
          communityAccount: community,
          communityMember: community_member_account_owner,
          userState: owner_state,
          owner: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      ).rpc();
    console.log("Your transaction signature", tx);
    
    } catch (error) {
      if (!error.message.includes("UserAlreadyModerator.")) {
        console.log("add mod",error);
      }
    }
  });

  it("Edit member data.", async () => {

    // Community member'ın bilgilerini degistiriyoruz.
    // Community'ye eklenmiş bir kullanıcının community accountunu editliyoruz

    const tx = await program.methods.editCommunityMemberData(
      "Test_Name",
      "test.com/profile.png",
      provider.wallet.publicKey,
    ).accounts(
      {
        communityAccount: community,
        communityMember: community_member_account_owner,
        systemProgram: anchor.web3.SystemProgram.programId,
        
      }
    ).rpc();

    console.log("Your transaction signature", tx);


  });

  it("Create community token.", async () => {

    try {
          
    //new anchor.web3.Connection(anchor.web3.clusterApiUrl("devnet"));
    // Önce community cüzdanında yeterli miktarda SOL olup olmadığını kontrol ediyoruz.
    // yoksa ekliyoruz (airdrop) , Devnet için geçerli bu durum
    let community_account_balance = await connection.getBalance(community_wallet.publicKey);

    console.log("Community account balance: ", community_account_balance);

    let i = community_account_balance;
    while (i < 6 * anchor.web3.LAMPORTS_PER_SOL) {
      let airdrop = connection.requestAirdrop(community_wallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
        .then((res) => {
          console.log("Airdrop successful");
        }).catch((err) => {
          console.log("Airdrop failed");
        });
      i += 2 * anchor.web3.LAMPORTS_PER_SOL;
      // 1 saniye bekle
      await new Promise(r => setTimeout(r, 10000));
    }



    let payer = community_wallet.payer;
    // Tokenımızın mint hesabını oluşturuyoruz
    if (!mint ){
      mint = await createNewMint(
        connection,
        payer,
        community_wallet.publicKey,
        community_wallet.publicKey,
        8,
      );
    }

    // Community cüzdanına token hesabı oluşturuyoruz
    const tokenAccount = await createTokenAccount(
      connection,
      community_wallet.payer,
      mint,
      community_wallet_keypair.publicKey,
    );

    // Community accountuna mint ve token adreslerini ekliyoruz
    const tx = await program.methods.addToken(
      mint,
      tokenAccount.address).accounts(
        {
          communityAccount: community,
          communityOwner: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        }
      ).rpc();
      
    console.log("Your transaction signature", tx);

        } catch (error) {
            if (!error.message.includes("CommunityTokenAlreadyExists")) {
              console.log("create token and token account to community",error);
            }
        }
  });                                                                                         
  

  it("Upload token metadata.", async () => {

    let name = "Test Token";
    let description = "Test Token Description";

    // let mint = new anchor.web3.PublicKey("2UiH979Y8D76PhsXJihnL7AEZtvhaf2zwi9nqNRSXykV");

    // Tokenımızın metadatalarını yüklüyoruz
    let payer = community_wallet.payer;
    const metadata = await uploadTokenMetadata(
      connection,
      metaplex,
      mint,
      community_wallet.payer,
      community_wallet.payer,
      name,
      "Test",
      description,
      [
        // {
        //   address:user.publicKey,
        //   verified:true,
        //   share:100
        // }
      ]

    );

  });

  it("Create token account for user.", async () => {

    // let mint = new anchor.web3.PublicKey("2UiH979Y8D76PhsXJihnL7AEZtvhaf2zwi9nqNRSXykV");
    // Tokena sahip olacak kullanıcının Associated Token Account'unu oluşturuyoruz.
    // bu işlem tüm üyeler için yapılmalıdır
    custom_member_token_account = await createTokenAccount(
      connection,
      community_wallet.payer,
      mint,
      custom_member.publicKey,
    ).then((res) => {
      return res;
    
    }).catch((err) => {
      console.log("create token account for user",err);
    }
    );

      
      
  });

  it("Mint token.", async () => {
    // tokenımızı mint ediyoruz ve istediğimiz kullanıcıya veriyoruz
    let tx = await mintToken(
      connection,
      community_wallet.payer,
      mint,
      custom_member_token_account.address,
      community_wallet.payer,
      52 
    )

    console.log("Mint token tx: ", tx);
    
  });

  it("Create community product", async () => {

    let tx = await program.methods.createCommunityProduct(
      new anchor.BN(2),
      "1 Community Token",
      "1 Community Token Description",
      "https://www.arweave.net/1",
      1.0,
      0.001,
      0.002,
    ).accounts(
      {
        communityAccount: community,
        owner: community_wallet_keypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        sender : provider.wallet.publicKey,
        product:community_product_PDA
      }
      
    )
    .signers([community_wallet_keypair])
    .rpc();

    console.log("Create community product tx: ", tx);
    

  });




});


