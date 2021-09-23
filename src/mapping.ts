import { BigInt, ethereum } from "@graphprotocol/graph-ts"
import { Anonymice, Transfer as TransferEvent } from "../generated/Anonymice/Anonymice"
import { Mouse, Transfer, Wallet } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  let fromAddress = event.params.from
  let toAddress = event.params.to
  let tokenId = event.params.tokenId
  let fromId = fromAddress.toHex()
  let fromWallet = Wallet.load(fromId)

  if (!fromWallet) {
    fromWallet = new Wallet(fromId)
    fromWallet.address = fromAddress
    fromWallet.joined = event.block.timestamp
    fromWallet.heldCount = BigInt.fromI32(0)
    fromWallet.save()
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.heldCount = fromWallet.heldCount.minus(BigInt.fromI32(1))
      fromWallet.save()
    }
  }

  let toId = toAddress.toHex()
  let toWallet = Wallet.load(toId)
  if (!toWallet) {
    toWallet = new Wallet(toId)
    toWallet.address = toAddress
    toWallet.joined = event.block.timestamp
    toWallet.heldCount = BigInt.fromI32(1)
    toWallet.save()
  } else {
    toWallet.heldCount = toWallet.heldCount.plus(BigInt.fromI32(1))
    toWallet.save()
  }

  let mouse = Mouse.load(tokenId.toString())
  if (mouse == null) {
    mouse = new Mouse(tokenId.toString())
    let contract = Anonymice.bind(event.address)

    let tokenHash = contract._tokenIdToHash(tokenId)
    let imageResult: ethereum.CallResult<string> = contract.try_hashToSVG(tokenHash)

    mouse.numericId = tokenId.toI32()
    mouse.name = "Anonymice #" + tokenId.toString()
    mouse.image = imageResult.reverted ? "" : imageResult.value
    mouse.minted = event.block.timestamp
  }
  mouse.owner = event.params.to
  mouse.currentOwner = toWallet.id
  mouse.save()

  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
  )

  transfer.mouse = tokenId.toString()
  transfer.from = fromWallet.id
  transfer.to = toWallet.id
  transfer.txHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  transfer.save()
}

function isZeroAddress(string: string): boolean {
  return string == "0x0000000000000000000000000000000000000000"
}
