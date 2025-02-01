import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Test certifier registration and skill addition",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const certifier = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall('skill-certification', 'register-certifier', 
                [types.principal(certifier.address)], 
                deployer.address
            ),
            Tx.contractCall('skill-certification', 'add-skill',
                [types.ascii("Blockchain Development"),
                 types.ascii("Proficiency in developing smart contracts")],
                deployer.address
            )
        ]);

        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectOk().expectUint(1);
    }
});

Clarinet.test({
    name: "Test certificate issuance and validation",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const certifier = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;

        let block = chain.mineBlock([
            Tx.contractCall('skill-certification', 'register-certifier',
                [types.principal(certifier.address)],
                deployer.address
            ),
            Tx.contractCall('skill-certification', 'add-skill',
                [types.ascii("Blockchain Development"),
                 types.ascii("Proficiency in developing smart contracts")],
                deployer.address
            ),
            Tx.contractCall('skill-certification', 'issue-certificate',
                [types.principal(recipient.address),
                 types.uint(1)],
                certifier.address
            )
        ]);

        block.receipts.forEach(receipt => {
            receipt.result.expectOk();
        });

        let validateBlock = chain.mineBlock([
            Tx.contractCall('skill-certification', 'is-certificate-valid',
                [types.principal(recipient.address),
                 types.uint(1)],
                deployer.address
            )
        ]);

        validateBlock.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Test skill endorsement functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const certifier = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const endorser = accounts.get('wallet_3')!;

        let block = chain.mineBlock([
            Tx.contractCall('skill-certification', 'register-certifier',
                [types.principal(certifier.address)],
                deployer.address
            ),
            Tx.contractCall('skill-certification', 'add-skill',
                [types.ascii("Blockchain Development"),
                 types.ascii("Proficiency in developing smart contracts")],
                deployer.address
            ),
            Tx.contractCall('skill-certification', 'issue-certificate',
                [types.principal(recipient.address),
                 types.uint(1)],
                certifier.address
            ),
            Tx.contractCall('skill-certification', 'endorse-skill',
                [types.principal(recipient.address),
                 types.uint(1),
                 types.uint(5),
                 types.ascii("Excellent blockchain developer")],
                endorser.address
            )
        ]);

        block.receipts.forEach(receipt => {
            receipt.result.expectOk();
        });

        let endorsementBlock = chain.mineBlock([
            Tx.contractCall('skill-certification', 'get-endorsement',
                [types.principal(recipient.address),
                 types.uint(1),
                 types.principal(endorser.address)],
                deployer.address
            )
        ]);

        endorsementBlock.receipts[0].result.expectOk();
    }
});
