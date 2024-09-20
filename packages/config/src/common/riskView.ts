import {
  assert,
  ProjectId,
  Sentiment,
  WarningValueWithSentiment,
  formatSeconds,
} from '@l2beat/shared-pure'
import { utils } from 'ethers'

import { ScalingProjectRiskViewEntry } from './ScalingProjectRisk'
import { ScalingProjectRiskView } from './ScalingProjectRiskView'
import { DATA_AVAILABILITY } from './dataAvailability'

export function makeBridgeCompatible(
  entry: Omit<ScalingProjectRiskView, 'sourceUpgradeability'>,
): ScalingProjectRiskView {
  return {
    ...entry,
    sourceUpgradeability: entry.exitWindow,
  }
}

// State validation

export const STATE_NONE: ScalingProjectRiskViewEntry = {
  value: 'In development',
  description:
    'Currently the system permits invalid state roots. More details in project overview.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export const STATE_FP: ScalingProjectRiskViewEntry = {
  value: 'Fraud proofs',
  description:
    'Fraud proofs allow actors watching the chain to prove that the state is incorrect.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const STATE_FP_1R: ScalingProjectRiskViewEntry = {
  value: 'Fraud proofs (1R)',
  description:
    'Fraud proofs allow actors watching the chain to prove that the state is incorrect. Single round proofs (1R) only require a single transaction to resolve.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const STATE_FP_INT: ScalingProjectRiskViewEntry = {
  value: 'Fraud proofs (INT)',
  description:
    'Fraud proofs allow actors watching the chain to prove that the state is incorrect. Interactive proofs (INT) require multiple transactions over time to resolve.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const STATE_FP_INT_ZK: ScalingProjectRiskViewEntry = {
  value: 'Fraud proofs (INT, ZK)',
  description:
    'Fraud proofs allow actors watching the chain to prove that the state is incorrect. Interactive proofs (INT) require multiple transactions over time to resolve. ZK proofs are used to adjudicate the correctness of the last step.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const STATE_ZKP_SN: ScalingProjectRiskViewEntry = {
  value: 'ZK proofs (SN)',
  description:
    'zkSNARKS are zero knowledge proofs that ensure state correctness, but require trusted setup.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const STATE_ZKP_ST: ScalingProjectRiskViewEntry = {
  value: 'ZK proofs (ST)',
  description:
    'zkSTARKS are zero knowledge proofs that ensure state correctness.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export function STATE_ZKP_L3(L2: string): ScalingProjectRiskViewEntry {
  return {
    value: 'ZK proofs',
    description: `Zero knowledge cryptography is used to ensure state correctness. Proofs are first verified on ${L2} and finally on Ethereum.`,
    sentiment: 'good',
    definingMetric: Infinity,
  }
}

export const STATE_EXITS_ONLY: ScalingProjectRiskViewEntry = {
  value: 'Exits only',
  description:
    'Exits from the network are subject to a period when they can be challenged. The internal network state is left unchecked.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export function STATE_ARBITRUM_FRAUD_PROOFS(
  nOfChallengers: number,
  challengeWindowSeconds?: number,
): ScalingProjectRiskViewEntry {
  const challengePeriod = challengeWindowSeconds
    ? ` There is a ${formatSeconds(challengeWindowSeconds)} challenge period.`
    : ''

  let descriptionBase: string
  let sentiment: 'bad' | 'warning'

  if (nOfChallengers === 1) {
    descriptionBase =
      'No actor outside of the single Proposer can submit fraud proofs. ' +
      'Interactive proofs (INT) require multiple transactions over time to resolve. ' +
      'The challenge protocol can be subject to delay attacks.'
    sentiment = 'bad'
  } else if (nOfChallengers < 5) {
    descriptionBase =
      `Fraud proofs only allow ${nOfChallengers} WHITELISTED actors watching the chain to prove that the state is incorrect. ` +
      'Interactive proofs (INT) require multiple transactions over time to resolve. ' +
      'The challenge protocol can be subject to delay attacks.'
    sentiment = 'bad'
  } else {
    descriptionBase =
      `Fraud proofs allow ${nOfChallengers} WHITELISTED actors watching the chain to prove that the state is incorrect. ` +
      'Interactive proofs (INT) require multiple transactions over time to resolve.'
    sentiment = 'warning'
  }

  return {
    value: 'Fraud proofs (INT)',
    description: descriptionBase + challengePeriod,
    sentiment: sentiment,
    definingMetric: nOfChallengers,
  }
}

// Data availability

export const DATA_ON_CHAIN: ScalingProjectRiskViewEntry = {
  value: 'Onchain',
  description:
    'All of the data needed for proof construction is published on Ethereum L1.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const DATA_ON_CHAIN_L3: ScalingProjectRiskViewEntry = {
  value: 'Onchain',
  description:
    'All of the data needed for proof construction is published on the base chain, which ultimately gets published on Ethereum.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const DATA_ON_CHAIN_STATE_DIFFS: ScalingProjectRiskViewEntry = {
  value: 'Onchain (SD)',
  description:
    'All of the data (SD = state diffs) needed for proof construction is published onchain.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const DATA_MIXED: ScalingProjectRiskViewEntry = {
  value: 'Mixed',
  description:
    'Some of the data needed for proof construction is not published onchain.',
  sentiment: 'warning',
  definingMetric: 0,
}

export const DATA_EXTERNAL_MEMO: ScalingProjectRiskViewEntry = {
  value: 'External (MEMO)',
  description: 'Transaction data is kept in MEMO decentralized storage.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export function DATA_EXTERNAL_DAC(DAC?: {
  membersCount: number
  requiredSignatures: number
}): ScalingProjectRiskViewEntry {
  const additionalString =
    DAC !== undefined
      ? ` with a threshold of ${DAC.requiredSignatures}/${DAC.membersCount}`
      : ``

  return {
    value: 'External (DAC)',
    description: `Proof construction relies fully on data that is NOT published onchain. There exists a Data Availability Committee (DAC)${additionalString} that is tasked with protecting and supplying the data.`,
    sentiment: DATA_AVAILABILITY.DAC_SENTIMENT(DAC),
    definingMetric: DAC ? DAC.requiredSignatures / DAC.membersCount : -Infinity,
  }
}

export const DATA_EXTERNAL: ScalingProjectRiskViewEntry = {
  value: 'External',
  description:
    'Proof construction and state derivation rely fully on data that is NOT published onchain.',
  sentiment: 'bad',
}

export const DATA_EXTERNAL_L3: ScalingProjectRiskViewEntry = {
  value: 'External',
  description:
    'Proof construction and state derivation rely fully on data that is ultimately NOT published on Ethereum.',
  sentiment: 'bad',
}

export function DATA_CELESTIA(
  isUsingBlobstream: boolean,
): ScalingProjectRiskViewEntry {
  const additional = isUsingBlobstream
    ? ' Sequencer tx roots are checked against the Blobstream bridge data roots, signed off by Celestia validators.'
    : ' Sequencer tx roots are not checked against the Blobstream bridge data roots onchain, but L2 nodes can verify data availability by running a Celestia light client.'
  return {
    value: 'External',
    description:
      `Proof construction and state derivation fully rely on data that is posted on Celestia.` +
      additional,
    sentiment: 'bad',
  }
}

// bridges

export const VALIDATED_BY_ETHEREUM: ScalingProjectRiskViewEntry = {
  value: 'Ethereum',
  description: 'Smart contracts on Ethereum validate all bridge transfers.',
  sentiment: 'good',
}

type L2sWithL3Support = ProjectId

export function VALIDATED_BY_L2(
  chain: L2sWithL3Support,
): ScalingProjectRiskViewEntry {
  return {
    value: capitalize(chain.toString()),
    description: `Smart contracts on ${chain.toString()} validate all bridge transfers. Additionally, the security of the system depends on the security of the base layer.`,
    sentiment: 'warning',
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function NATIVE_AND_CANONICAL(
  nativeTokens = 'ETH',
  isAre: 'is' | 'are' = 'is',
): ScalingProjectRiskViewEntry {
  return {
    value: 'Native & Canonical',
    description: `${nativeTokens} transferred via this bridge ${isAre} used to pay for gas and other tokens transferred are considered canonical on the destination chain.`,
    sentiment: 'good',
  }
}

export const CANONICAL: ScalingProjectRiskViewEntry = {
  value: 'Canonical',
  description:
    'Tokens transferred are considered canonical on the destination chain.',
  sentiment: 'good',
}

export const CANONICAL_USDC: ScalingProjectRiskViewEntry = {
  value: 'Canonical',
  description:
    'USDC transferred is considered canonical as it is the basis of the perpetual protocol on the chain.',
  sentiment: 'good',
}

export const UPCOMING_RISK: ScalingProjectRiskViewEntry = {
  value: '',
  description: 'No information available.',
  sentiment: 'neutral',
}

export const UPCOMING_RISK_VIEW: ScalingProjectRiskView = makeBridgeCompatible({
  stateValidation: UPCOMING_RISK,
  dataAvailability: UPCOMING_RISK,
  exitWindow: UPCOMING_RISK,
  sequencerFailure: UPCOMING_RISK,
  proposerFailure: UPCOMING_RISK,
  destinationToken: UPCOMING_RISK,
  validatedBy: UPCOMING_RISK,
})

export const UNDER_REVIEW_RISK: ScalingProjectRiskViewEntry = {
  value: 'Under Review',
  description: 'This risk is currently under review.',
  sentiment: 'UnderReview',
}

export const UNDER_REVIEW_RISK_VIEW: ScalingProjectRiskView =
  makeBridgeCompatible({
    stateValidation: UNDER_REVIEW_RISK,
    dataAvailability: UNDER_REVIEW_RISK,
    exitWindow: UNDER_REVIEW_RISK,
    sequencerFailure: UNDER_REVIEW_RISK,
    proposerFailure: UNDER_REVIEW_RISK,
    destinationToken: UNDER_REVIEW_RISK,
    validatedBy: UNDER_REVIEW_RISK,
  })

/* New risks for stages */

// SEQUENCER COLUMN

export function SEQUENCER_SELF_SEQUENCE(
  delay?: number,
): ScalingProjectRiskViewEntry {
  const delayString =
    delay !== undefined
      ? delay === 0
        ? ' There is no delay on this operation.'
        : ` There is a ${formatSeconds(delay)} delay on this operation.`
      : ''
  return {
    value: 'Self sequence',
    description: `In the event of a sequencer failure, users can force transactions to be included in the project's chain by sending them to L1.${delayString}`,
    sentiment: 'good',
    definingMetric: delay,
  }
}

export function SEQUENCER_SELF_SEQUENCE_ZK(
  delay?: number,
): ScalingProjectRiskViewEntry {
  return {
    ...SEQUENCER_SELF_SEQUENCE(delay),
    description:
      SEQUENCER_SELF_SEQUENCE(delay).description +
      ' Proposing new blocks requires creating ZK proofs.',
  }
}

export function SEQUENCER_FORCE_VIA_L1(
  delay?: number,
): ScalingProjectRiskViewEntry {
  const delayString =
    delay !== undefined ? ' for more than ' + formatSeconds(delay) : ''
  return {
    value: 'Force via L1',
    description: `Users can force the sequencer to include a withdrawal transaction by submitting a request through L1. If the sequencer censors or is down for ${delayString}, users can use the exit hatch to withdraw their funds.`,
    sentiment: 'good',
    definingMetric: delay,
  }
}

export function SEQUENCER_FORCE_VIA_L1_STARKEX_PERPETUAL(
  delay: number,
): ScalingProjectRiskViewEntry {
  const delayString = formatSeconds(delay)
  return {
    value: 'Force via L1',
    description: `Users can force the sequencer to include a trade or a withdrawal transaction by submitting a request through L1. If the sequencer censors or is down for ${delayString}, users can use the exit hatch to withdraw their funds. Users are required to find a counterparty for the trade by out of system means.`,
    sentiment: 'good',
    definingMetric: delay,
  }
}

export function SEQUENCER_FORCE_VIA_L1_LOOPRING(
  delay: number,
  forcedWithdrawalFee: number,
  maxAgeDepositUntilWithdrawable: number,
): ScalingProjectRiskViewEntry {
  const delayString = formatSeconds(delay)
  const maxAgeDepositUntilWithdrawableString = formatSeconds(
    maxAgeDepositUntilWithdrawable,
  )
  const forcedWithdrawalFeeString = `${utils.formatEther(
    forcedWithdrawalFee,
  )} ETH`
  return {
    value: 'Force via L1',
    description: `Users can force the sequencer to include a withdrawal transaction by submitting a request through L1 with a ${forcedWithdrawalFeeString} fee. If the sequencer is down for more than ${delayString}, users can use the exit hatch to withdraw their funds. The sequencer can censor individual deposits, but in such case after ${maxAgeDepositUntilWithdrawableString} users can get their funds back.`,
    sentiment: 'good',
    definingMetric: delay,
  }
}

export function SEQUENCER_ENQUEUE_VIA(
  layer: 'L1' | 'L2',
): ScalingProjectRiskViewEntry {
  return {
    value: `Enqueue via ${layer}`,
    description: `Users can submit transactions to an ${layer} queue, but can't force them. The sequencer cannot selectively skip transactions but can stop processing the queue entirely. In other words, if the sequencer censors or is down, it is so for everyone.`,
    sentiment: 'warning',
  }
}

export function SEQUENCER_NO_MECHANISM(
  disabled?: boolean,
): ScalingProjectRiskViewEntry {
  const additional =
    disabled === true
      ? ' Although the functionality exists in the code, it is currently disabled.'
      : ''
  return {
    value: 'No mechanism',
    description:
      'There is no mechanism to have transactions be included if the sequencer is down or censoring.' +
      additional,
    sentiment: 'bad',
  }
}

// PROPOSER COLUMN

export const PROPOSER_CANNOT_WITHDRAW: ScalingProjectRiskViewEntry = {
  value: 'Cannot withdraw',
  description:
    'Only the whitelisted proposers can publish state roots on L1, so in the event of failure the withdrawals are frozen.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export const PROPOSER_WHITELIST_GOVERNANCE: ScalingProjectRiskViewEntry = {
  value: 'Cannot withdraw',
  description:
    'Only the whitelisted proposers can publish state roots on L1, so in the event of failure the withdrawals are frozen. There is a decentralized Governance system that can attempt changing Proposers with an upgrade.',
  sentiment: 'warning',
  definingMetric: -Infinity,
}

export const PROPOSER_USE_ESCAPE_HATCH_ZK: ScalingProjectRiskViewEntry = {
  value: 'Use escape hatch',
  description:
    'Users are able to trustlessly exit by submitting a zero knowledge proof of funds.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const PROPOSER_USE_ESCAPE_HATCH_MP: ScalingProjectRiskViewEntry = {
  value: 'Use escape hatch',
  description:
    'Users are able to trustlessly exit by submitting a Merkle proof of funds.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const PROPOSER_USE_ESCAPE_HATCH_MP_NFT: ScalingProjectRiskViewEntry = {
  ...PROPOSER_USE_ESCAPE_HATCH_MP,
  description:
    PROPOSER_USE_ESCAPE_HATCH_MP.description +
    ' NFTs will be minted on L1 to exit.',
  definingMetric: Infinity,
}

export const PROPOSER_USE_ESCAPE_HATCH_MP_AVGPRICE: ScalingProjectRiskViewEntry =
  {
    ...PROPOSER_USE_ESCAPE_HATCH_MP,
    description:
      PROPOSER_USE_ESCAPE_HATCH_MP.description +
      ' Positions will be closed using the average price from the last batch state update.',
    definingMetric: Infinity,
  }

export function PROPOSER_SELF_PROPOSE_WHITELIST_DROPPED(
  delay: number,
): ScalingProjectRiskViewEntry {
  const delayString = formatSeconds(delay)
  return {
    value: 'Self propose',
    description: `Anyone can become a Proposer after ${delayString} of inactivity from the currently whitelisted Proposers.`,
    sentiment: 'good',
    definingMetric: delay,
  }
}

export const PROPOSER_SELF_PROPOSE_ZK: ScalingProjectRiskViewEntry = {
  value: 'Self propose',
  description:
    'If the Proposer fails, users can leverage the source available prover to submit proofs to the L1 bridge.',
  sentiment: 'good',
}

export const PROPOSER_SELF_PROPOSE_ROOTS: ScalingProjectRiskViewEntry = {
  value: 'Self propose',
  description:
    'Anyone can be a Proposer and propose new roots to the L1 bridge.',
  sentiment: 'good',
}

export function EXIT_WINDOW(
  upgradeDelay: number,
  exitDelay: number,
  upgradeDelay2?: number,
  existsBlocklist: boolean = false,
): ScalingProjectRiskViewEntry {
  let window: number = upgradeDelay - exitDelay
  const windowText = window <= 0 ? 'None' : formatSeconds(window)
  if (upgradeDelay2 !== undefined) {
    const window2: number = upgradeDelay2 - exitDelay
    const windowString2 = window2 <= 0 ? 'None' : formatSeconds(window2)
    if (windowText !== windowString2) {
      window = Math.min(window, window2)
    }
  }
  let sentiment: Sentiment
  if (window < 7 * 24 * 60 * 60) {
    sentiment = 'bad'
  } else if (window < 30 * 24 * 60 * 60) {
    sentiment = 'warning'
  } else {
    sentiment = 'good'
  }
  const instantlyUpgradable =
    upgradeDelay === 0 ? ' since contracts are instantly upgradable' : ''
  const description =
    (windowText === 'None'
      ? `There is no window for users to exit in case of an unwanted regular upgrade${instantlyUpgradable}.`
      : `Users have ${windowText} to exit funds in case of an unwanted regular upgrade. There is a ${formatSeconds(
          upgradeDelay,
        )} delay before a regular upgrade is applied${instantlyUpgradable}, and withdrawals can take up to ${formatSeconds(
          exitDelay,
        )} to be processed.`) +
    (existsBlocklist
      ? ' Users can be explicitly censored from withdrawing (Blocklist on L1).'
      : '')

  return {
    value: windowText,
    description: description,
    sentiment,
    definingMetric: window,
  }
}

export function EXIT_WINDOW_ZKSTACK(
  upgradeDelay: number,
): ScalingProjectRiskViewEntry {
  // const warning: WarningValueWithSentiment = {
  //   value: 'The EmergencyUpgradeBoard can upgrade with no delay.',
  //   sentiment: 'bad',
  // }
  return {
    value: 'None',
    sentiment: 'bad',
    description: `There is no window for users to exit in case of an unwanted standard upgrade bacause the central operator can censor withdrawal transactions by implementing a TransactionFilterer with no delay. The standard upgrade delay is ${formatSeconds(
      upgradeDelay,
    )}.`,
    // warning: warning,
  }
}

export function EXIT_WINDOW_NITRO(
  l2TimelockDelay: number,
  selfSequencingDelay: number,
  challengeWindowSeconds: number,
  validatorAfkTime: number,
  l1TimelockDelay: number,
): ScalingProjectRiskViewEntry {
  const description = `Non-emergency upgrades are initiated on L2 and go through a ${formatSeconds(
    l2TimelockDelay,
  )} delay. Since there is a ${formatSeconds(
    selfSequencingDelay,
  )} delay to force a tx (forcing the inclusion in the following state update), users have only ${formatSeconds(
    l2TimelockDelay - selfSequencingDelay,
  )} to exit. 
    
  If users post a tx after that time, they would only be able to self propose a state root ${formatSeconds(
    challengeWindowSeconds + validatorAfkTime, // see `_validatorIsAfk()` https://etherscan.io/address/0xA0Ed0562629D45B88A34a342f20dEb58c46C15ff#code#F1#L43
  )} after the last state root was proposed and then wait for the ${formatSeconds(
    challengeWindowSeconds,
  )} challenge window, while the upgrade would be confirmed just after the ${formatSeconds(
    challengeWindowSeconds,
  )} challenge window and the ${formatSeconds(l1TimelockDelay)} L1 timelock.`
  const warning: WarningValueWithSentiment = {
    value: 'The Security Council can upgrade with no delay.',
    sentiment: 'bad',
  }
  return {
    ...EXIT_WINDOW(l2TimelockDelay, selfSequencingDelay),
    description: description,
    warning: warning,
  }
}

export const EXIT_WINDOW_NON_UPGRADABLE: ScalingProjectRiskViewEntry = {
  value: '∞',
  description:
    'Users can exit funds at any time because contracts are not upgradeable.',
  sentiment: 'good',
  definingMetric: Infinity,
}

export const EXIT_WINDOW_UNKNOWN: ScalingProjectRiskViewEntry = {
  value: 'Unknown',
  description:
    'Some contracts are not verified, so there is no way to assess the exit window.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export const UPGRADABLE_YES: ScalingProjectRiskViewEntry = {
  value: 'Yes',
  description:
    'The code that secures the system can be changed arbitrarily and without notice.',
  sentiment: 'bad',
  definingMetric: -Infinity,
}

export const RISK_VIEW = {
  STATE_NONE,
  STATE_FP,
  STATE_FP_1R,
  STATE_FP_INT,
  STATE_FP_INT_ZK,
  STATE_ZKP_SN,
  STATE_ZKP_ST,
  STATE_ZKP_L3,
  STATE_EXITS_ONLY,
  STATE_ARBITRUM_FRAUD_PROOFS,
  DATA_ON_CHAIN,
  DATA_ON_CHAIN_STATE_DIFFS,
  DATA_ON_CHAIN_L3,
  DATA_MIXED,
  DATA_EXTERNAL_DAC,
  DATA_EXTERNAL_MEMO,
  DATA_EXTERNAL,
  DATA_EXTERNAL_L3,
  DATA_CELESTIA,
  UPGRADABLE_YES,
  VALIDATED_BY_ETHEREUM,
  VALIDATED_BY_L2,
  NATIVE_AND_CANONICAL,
  CANONICAL,
  CANONICAL_USDC,
  SEQUENCER_SELF_SEQUENCE,
  SEQUENCER_SELF_SEQUENCE_ZK,
  SEQUENCER_FORCE_VIA_L1,
  SEQUENCER_FORCE_VIA_L1_STARKEX_PERPETUAL,
  SEQUENCER_FORCE_VIA_L1_LOOPRING,
  SEQUENCER_ENQUEUE_VIA,
  SEQUENCER_NO_MECHANISM,
  PROPOSER_CANNOT_WITHDRAW,
  PROPOSER_WHITELIST_GOVERNANCE,
  PROPOSER_USE_ESCAPE_HATCH_ZK,
  PROPOSER_USE_ESCAPE_HATCH_MP,
  PROPOSER_USE_ESCAPE_HATCH_MP_NFT,
  PROPOSER_USE_ESCAPE_HATCH_MP_AVGPRICE,
  PROPOSER_SELF_PROPOSE_WHITELIST_DROPPED,
  PROPOSER_SELF_PROPOSE_ZK,
  PROPOSER_SELF_PROPOSE_ROOTS,
  UNDER_REVIEW_RISK,
  EXIT_WINDOW,
  EXIT_WINDOW_NITRO,
  EXIT_WINDOW_ZKSTACK,
  EXIT_WINDOW_NON_UPGRADABLE,
  EXIT_WINDOW_UNKNOWN,
}

export function pickWorseRisk(
  a: ScalingProjectRiskViewEntry,
  b: ScalingProjectRiskViewEntry,
): ScalingProjectRiskViewEntry {
  if (a.sentiment === 'UnderReview' || b.sentiment === 'UnderReview') {
    return a.sentiment === 'UnderReview' ? a : b
  }

  const sentimentValue: Record<Sentiment, number> = {
    good: 0,
    neutral: 1,
    warning: 2,
    bad: 3,
    UnderReview: 4,
  }

  const aVal = sentimentValue[a.sentiment]
  const bVal = sentimentValue[b.sentiment]
  if (aVal === bVal) {
    assert(
      a.definingMetric !== undefined && b.definingMetric !== undefined,
      'Unable to pick worse risk without a defining metric',
    )
    return a.definingMetric < b.definingMetric ? a : b
  }
  if (aVal > bVal) {
    return a
  }

  return b
}

export function sumRisk(
  a: ScalingProjectRiskViewEntry,
  b: ScalingProjectRiskViewEntry,
  formattingFunction: (delay: number) => ScalingProjectRiskViewEntry,
): ScalingProjectRiskViewEntry {
  if (
    a.sentiment !== 'bad' &&
    b.sentiment !== 'bad' &&
    a.sentiment === b.sentiment
  ) {
    assert(
      a.definingMetric !== undefined && b.definingMetric !== undefined,
      'Cannot sum good risks without delaySeconds',
    )
    return formattingFunction(a.definingMetric + b.definingMetric)
  }

  return pickWorseRisk(a, b)
}
