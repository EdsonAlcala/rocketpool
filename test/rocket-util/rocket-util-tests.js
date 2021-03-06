import { printTitle, assertThrows } from '../_lib/utils/general';
import { TestLists, TestQueues, TestSets } from '../_lib/artifacts';
import { scenarioPushListItem, scenarioSetListItem, scenarioInsertListItem, scenarioRemoveOListItem, scenarioRemoveUListItem } from './rocket-list-storage-scenarios';
import { scenarioEnqueueItem, scenarioDequeueItem, scenarioRemoveQueueItem } from './rocket-queue-storage-scenarios';
import { scenarioAddItem, scenarioRemoveItem } from './rocket-set-storage-scenarios';

export default function() {


    // Run list tests by type
    function listTests(name, prefix, key, testValues, indexOfTests = true) {
        contract(name, async (accounts) => {


            // Contract dependencies
            let testLists;
            before(async () => {
                testLists = await TestLists.deployed();
                testLists.init();
            });


            // Push an item onto a list
            it(printTitle('-----', 'push an item onto a list'), async () => {

                // Push items
                await scenarioPushListItem({
                    prefix,
                    key,
                    value: testValues[0],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioPushListItem({
                    prefix,
                    key,
                    value: testValues[1],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioPushListItem({
                    prefix,
                    key,
                    value: testValues[2],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Test indexOf
                if (indexOfTests) {
                    let index1 = await testLists[`${prefix}_getListIndexOf`].call(key, testValues[2]);
                    let index2 = await testLists[`${prefix}_getListIndexOf`].call(key, testValues[6]);
                    assert.equal(index1.valueOf(), 2, 'getListIndexOf returned incorrect index');
                    assert.equal(index2.valueOf(), -1, 'getListIndexOf returned index when value did not exist');
                }

            });


            // Set a list item at index
            it(printTitle('-----', 'set a list item at index'), async () => {

                // Set item
                await scenarioSetListItem({
                    prefix,
                    key,
                    index: 1,
                    value: testValues[3],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Set item at out of bounds index
                await assertThrows(scenarioSetListItem({
                    prefix,
                    key,
                    index: 99,
                    value: testValues[6],
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Set a list item with an out of bounds index');

            });


            // Insert an item into a list at index
            it(printTitle('-----', 'insert an item into a list at index'), async () => {

                // Insert item
                await scenarioInsertListItem({
                    prefix,
                    key,
                    index: 1,
                    value: testValues[4],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Insert item at end of list
                let count = await testLists[`${prefix}_getListCount`].call(key);
                await scenarioInsertListItem({
                    prefix,
                    key,
                    index: count,
                    value: testValues[5],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Insert item at out of bounds index
                await assertThrows(scenarioInsertListItem({
                    prefix,
                    key,
                    index: 99,
                    value: testValues[6],
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Inserted a list item with an out of bounds index');

            });


            // Remove an item from an ordered list at index
            it(printTitle('-----', 'remove an item from an ordered list at index'), async () => {

                // Remove item
                await scenarioRemoveOListItem({
                    prefix,
                    key,
                    index: 2,
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Remove item at out of bounds index
                await assertThrows(scenarioRemoveOListItem({
                    prefix,
                    key,
                    index: 99,
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Removed a list item with an out of bounds index');

            });


            // Remove an item from an unordered list at index
            it(printTitle('-----', 'remove an item from an unordered list at index'), async () => {

                // Remove item
                await scenarioRemoveUListItem({
                    prefix,
                    key,
                    index: 1,
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Remove item at end of list
                let count = await testLists[`${prefix}_getListCount`].call(key);
                await scenarioRemoveUListItem({
                    prefix,
                    key,
                    index: count - 1,
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Remove an item at out of bounds index
                await assertThrows(scenarioRemoveUListItem({
                    prefix,
                    key,
                    index: 99,
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Removed a list item with an out of bounds index');

            });


        });
    }


    // Run queue tests by type
    function queueTests(name, prefix, key, testValues) {
        contract(name, async (accounts) => {


            // Contract dependencies
            let testQueues;
            before(async () => {
                testQueues = await TestQueues.deployed();
                testQueues.init();
            });


            // Perform multiple test runs to test queue wrapping
            for (let ri = 0; ri < 6; ++ri) {
                let runTestValues = testValues[ri];


                // Enqueue items
                it(printTitle('-----', 'enqueue items'), async () => {

                    // Check queue capacity
                    let capacity = parseInt(await testQueues[`${prefix}_capacity`].call()) - 1;
                    assert.isTrue(runTestValues.length > capacity, 'Pre-check failed - more queue capacity than test values'); // Set contract queue capacity to 4 for testing

                    // Enqueue until full
                    let i;
                    for (i = 0; i < capacity; ++i) {
                        await scenarioEnqueueItem({
                            prefix,
                            key,
                            value: runTestValues[i],
                            fromAddress: accounts[0],
                            gas: 500000,
                        });
                    }

                    // Attempt enqueue
                    await assertThrows(scenarioEnqueueItem({
                        prefix,
                        key,
                        value: runTestValues[i],
                        fromAddress: accounts[0],
                        gas: 500000,
                    }), 'Enqueued an item while queue is at capacity');

                });


                // Dequeue items (first 3 runs)
                if (ri < 3) {
                it(printTitle('-----', 'dequeue items'), async () => {

                    // Get queue length
                    let length = parseInt(await testQueues[`${prefix}_getQueueLength`].call(key));

                    // Dequeue until empty
                    for (let i = 0; i < length; ++i) {
                        await scenarioDequeueItem({
                            prefix,
                            key,
                            fromAddress: accounts[0],
                            gas: 500000,
                        });
                    }

                    // Attempt dequeue
                    await assertThrows(scenarioDequeueItem({
                        prefix,
                        key,
                        fromAddress: accounts[0],
                        gas: 500000,
                    }), 'Dequeued an item while queue is empty');

                });
                }

                // Remove items (last 3 runs)
                else {
                it(printTitle('-----', 'remove items'), async () => {

                    // Check queue length
                    let length = parseInt(await testQueues[`${prefix}_getQueueLength`].call(key));
                    assert.equal(length, 3, 'Pre-check failed - longer queue than removal index list length');

                    // Remove items
                    let removeItemsAt = [1, 2, 0];
                    for (let i = 0; i < length; ++i) {
                        let item = runTestValues[removeItemsAt[i]];
                        await scenarioRemoveQueueItem({
                            prefix,
                            key,
                            value: item,
                            fromAddress: accounts[0],
                            gas: 500000,
                        });
                    }

                    // Attempt removal
                    await assertThrows(scenarioRemoveQueueItem({
                        prefix,
                        key,
                        value: runTestValues[3],
                        fromAddress: accounts[0],
                        gas: 500000,
                    }), 'Removed a nonexistent item from queue');

                });
                }

            }


        });
    }


    // Run set tests by type
    function setTests(name, prefix, key, testValues) {
        contract(name, async (accounts) => {


            // Contract dependencies
            let testSets;
            before(async () => {
                testSets = await TestSets.deployed();
                testSets.init();
            });


            // Add items to a set
            it(printTitle('-----', 'add items to a set'), async () => {

                // Add items
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[0],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[1],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[2],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[3],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[4],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Add an existing item
                await assertThrows(scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[0],
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Added an existing item to a set');

            });


            // Remove items from a set
            it(printTitle('-----', 'remove items from a set'), async () => {

                // Remove items
                await scenarioRemoveItem({
                    prefix,
                    key,
                    value: testValues[2],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioRemoveItem({
                    prefix,
                    key,
                    value: testValues[0],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioRemoveItem({
                    prefix,
                    key,
                    value: testValues[4],
                    fromAddress: accounts[0],
                    gas: 500000,
                });

                // Remove a nonexistent item
                await assertThrows(scenarioRemoveItem({
                    prefix,
                    key,
                    value: testValues[5],
                    fromAddress: accounts[0],
                    gas: 500000,
                }), 'Removed a nonexistent item from a set');

            });


            // Add removed items to a set
            it(printTitle('-----', 'add removed items to a set'), async () => {
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[0],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
                await scenarioAddItem({
                    prefix,
                    key,
                    value: testValues[2],
                    fromAddress: accounts[0],
                    gas: 500000,
                });
            });


        });
    }


    // Run list tests
    listTests('AddressListStorage', 'address', web3.utils.soliditySha3('list.addresses'), [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000006',
        '0x0000000000000000000000000000000000000099',
    ]);
    listTests('BoolListStorage', 'bool', web3.utils.soliditySha3('list.bools'), [
        true,
        false,
        true,
        true,
        true,
        false,
        true,
    ], false);
    listTests('BytesListStorage', 'bytes', web3.utils.soliditySha3('list.bytes'), [
        web3.utils.soliditySha3('test string 1'),
        web3.utils.soliditySha3('test string 2'),
        web3.utils.soliditySha3('test string 3'),
        web3.utils.soliditySha3('test string 4'),
        web3.utils.soliditySha3('test string 5'),
        web3.utils.soliditySha3('test string 6'),
        web3.utils.soliditySha3('test string 99'),
    ]);
    listTests('Bytes32ListStorage', 'bytes32', web3.utils.soliditySha3('list.bytes32'), [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000000000000000000000000000006',
        '0x0000000000000000000000000000000000000000000000000000000000000099',
    ]);
    listTests('IntListStorage', 'int', web3.utils.soliditySha3('list.ints'), [
        -1,
        2,
        -3,
        4,
        -5,
        6,
        -99,
    ]);
    listTests('StringListStorage', 'string', web3.utils.soliditySha3('list.strings'), [
        'test string 1',
        'test string 2',
        'test string 3',
        'test string 4',
        'test string 5',
        'test string 6',
        'test string 99',
    ]);
    listTests('UintListStorage', 'uint', web3.utils.soliditySha3('list.uints'), [
        1,
        2,
        3,
        4,
        5,
        6,
        99,
    ]);

    // Run queue tests
    queueTests('AddressQueueStorage', 'address', web3.utils.soliditySha3('queue.addresses'), [
        [
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000002',
            '0x0000000000000000000000000000000000000003',
            '0x0000000000000000000000000000000000000004',
        ],
        [
            '0x0000000000000000000000000000000000000005',
            '0x0000000000000000000000000000000000000006',
            '0x0000000000000000000000000000000000000007',
            '0x0000000000000000000000000000000000000008',
        ],
        [
            '0x0000000000000000000000000000000000000009',
            '0x0000000000000000000000000000000000000010',
            '0x0000000000000000000000000000000000000011',
            '0x0000000000000000000000000000000000000012',
        ],
        [
            '0x0000000000000000000000000000000000000013',
            '0x0000000000000000000000000000000000000014',
            '0x0000000000000000000000000000000000000015',
            '0x0000000000000000000000000000000000000016',
        ],
        [
            '0x0000000000000000000000000000000000000017',
            '0x0000000000000000000000000000000000000018',
            '0x0000000000000000000000000000000000000019',
            '0x0000000000000000000000000000000000000020',
        ],
        [
            '0x0000000000000000000000000000000000000021',
            '0x0000000000000000000000000000000000000022',
            '0x0000000000000000000000000000000000000023',
            '0x0000000000000000000000000000000000000024',
        ],
    ]);
    queueTests('BytesQueueStorage', 'bytes', web3.utils.soliditySha3('queue.bytes'), [
        [
            web3.utils.soliditySha3('test string 1'),
            web3.utils.soliditySha3('test string 2'),
            web3.utils.soliditySha3('test string 3'),
            web3.utils.soliditySha3('test string 4'),
        ],
        [
            web3.utils.soliditySha3('test string 5'),
            web3.utils.soliditySha3('test string 6'),
            web3.utils.soliditySha3('test string 7'),
            web3.utils.soliditySha3('test string 8'),
        ],
        [
            web3.utils.soliditySha3('test string 9'),
            web3.utils.soliditySha3('test string 10'),
            web3.utils.soliditySha3('test string 11'),
            web3.utils.soliditySha3('test string 12'),
        ],
        [
            web3.utils.soliditySha3('test string 13'),
            web3.utils.soliditySha3('test string 14'),
            web3.utils.soliditySha3('test string 15'),
            web3.utils.soliditySha3('test string 16'),
        ],
        [
            web3.utils.soliditySha3('test string 17'),
            web3.utils.soliditySha3('test string 18'),
            web3.utils.soliditySha3('test string 19'),
            web3.utils.soliditySha3('test string 20'),
        ],
        [
            web3.utils.soliditySha3('test string 21'),
            web3.utils.soliditySha3('test string 22'),
            web3.utils.soliditySha3('test string 23'),
            web3.utils.soliditySha3('test string 24'),
        ],
    ]);
    queueTests('Bytes32QueueStorage', 'bytes32', web3.utils.soliditySha3('queue.bytes32'), [
        [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000002',
            '0x0000000000000000000000000000000000000000000000000000000000000003',
            '0x0000000000000000000000000000000000000000000000000000000000000004',
        ],
        [
            '0x0000000000000000000000000000000000000000000000000000000000000005',
            '0x0000000000000000000000000000000000000000000000000000000000000006',
            '0x0000000000000000000000000000000000000000000000000000000000000007',
            '0x0000000000000000000000000000000000000000000000000000000000000008',
        ],
        [
            '0x0000000000000000000000000000000000000000000000000000000000000009',
            '0x0000000000000000000000000000000000000000000000000000000000000010',
            '0x0000000000000000000000000000000000000000000000000000000000000011',
            '0x0000000000000000000000000000000000000000000000000000000000000012',
        ],
        [
            '0x0000000000000000000000000000000000000000000000000000000000000013',
            '0x0000000000000000000000000000000000000000000000000000000000000014',
            '0x0000000000000000000000000000000000000000000000000000000000000015',
            '0x0000000000000000000000000000000000000000000000000000000000000016',
        ],
        [
            '0x0000000000000000000000000000000000000000000000000000000000000017',
            '0x0000000000000000000000000000000000000000000000000000000000000018',
            '0x0000000000000000000000000000000000000000000000000000000000000019',
            '0x0000000000000000000000000000000000000000000000000000000000000020',
        ],
        [
            '0x0000000000000000000000000000000000000000000000000000000000000021',
            '0x0000000000000000000000000000000000000000000000000000000000000022',
            '0x0000000000000000000000000000000000000000000000000000000000000023',
            '0x0000000000000000000000000000000000000000000000000000000000000024',
        ],
    ]);
    queueTests('IntQueueStorage', 'int', web3.utils.soliditySha3('queue.ints'), [
        [
            -1,
            2,
            -3,
            4,
        ],
        [
            -5,
            6,
            -7,
            8,
        ],
        [
            -9,
            10,
            -11,
            12,
        ],
        [
            -13,
            14,
            -15,
            16,
        ],
        [
            -17,
            18,
            -19,
            20,
        ],
        [
            -21,
            22,
            -23,
            24,
        ],
    ]);
    queueTests('StringQueueStorage', 'string', web3.utils.soliditySha3('queue.strings'), [
        [
            'test string 1',
            'test string 2',
            'test string 3',
            'test string 4',
        ],
        [
            'test string 5',
            'test string 6',
            'test string 7',
            'test string 8',
        ],
        [
            'test string 9',
            'test string 10',
            'test string 11',
            'test string 12',
        ],
        [
            'test string 13',
            'test string 14',
            'test string 15',
            'test string 16',
        ],
        [
            'test string 17',
            'test string 18',
            'test string 19',
            'test string 20',
        ],
        [
            'test string 21',
            'test string 22',
            'test string 23',
            'test string 24',
        ],
    ]);
    queueTests('UintQueueStorage', 'uint', web3.utils.soliditySha3('queue.uints'), [
        [
            1,
            2,
            3,
            4,
        ],
        [
            5,
            6,
            7,
            8,
        ],
        [
            9,
            10,
            11,
            12,
        ],
        [
            13,
            14,
            15,
            16,
        ],
        [
            17,
            18,
            19,
            20,
        ],
        [
            21,
            22,
            23,
            24,
        ],
    ]);

    // Run set tests
    setTests('AddressSetStorage', 'address', web3.utils.soliditySha3('set.addresses'), [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000099',
    ]);
    setTests('BytesSetStorage', 'bytes', web3.utils.soliditySha3('set.bytes'), [
        web3.utils.soliditySha3('test string 1'),
        web3.utils.soliditySha3('test string 2'),
        web3.utils.soliditySha3('test string 3'),
        web3.utils.soliditySha3('test string 4'),
        web3.utils.soliditySha3('test string 5'),
        web3.utils.soliditySha3('test string 99'),
    ]);
    setTests('Bytes32SetStorage', 'bytes32', web3.utils.soliditySha3('set.bytes32'), [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000000000000000000000000000099',
    ]);
    setTests('IntSetStorage', 'int', web3.utils.soliditySha3('set.ints'), [
        -1,
        2,
        -3,
        4,
        -5,
        99,
    ]);
    setTests('StringSetStorage', 'string', web3.utils.soliditySha3('set.strings'), [
        'test string 1',
        'test string 2',
        'test string 3',
        'test string 4',
        'test string 5',
        'test string 99',
    ]);
    setTests('UintSetStorage', 'uint', web3.utils.soliditySha3('set.uints'), [
        1,
        2,
        3,
        4,
        5,
        99,
    ]);


};
