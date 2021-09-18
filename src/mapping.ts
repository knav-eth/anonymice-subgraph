import { Anonymice, Transfer } from "../generated/Anonymice/Anonymice"
import { Mouse } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId
  let mouse = Mouse.load(tokenId.toString())

  if (mouse == null) {
    mouse = new Mouse(tokenId.toString())

    let contract = Anonymice.bind(event.address)
    let tokenHash = contract._tokenIdToHash(tokenId)
    let image = contract.hashToSVG(tokenHash)

    mouse.name = "Anonymice #" + tokenId.toString()
    mouse.numericId = tokenId.toI32()
    mouse.image = image
  }

  mouse.owner = event.params.to
  mouse.save()
}
