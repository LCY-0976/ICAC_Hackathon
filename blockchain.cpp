#include <iostream>
#include <ctime>
#include <vector>
#include <functional>
#include <string>
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

namespace py = pybind11;
using namespace std;

// Transaction data
struct TransactionData {
    double amount;
    string senderKey;
    string receiverKey;
    time_t timestamp;
    
    // Default constructor
    TransactionData() : amount(0), senderKey(""), receiverKey(""), timestamp(0) {}
    
    // Parameterized constructor
    TransactionData(double amt, string sender, string receiver, time_t ts) 
        : amount(amt), senderKey(sender), receiverKey(receiver), timestamp(ts) {}
};

// Block Class
class Block {
private:
    int index;
    size_t blockHash;
    size_t previousHash;
    TransactionData data;

    size_t generateHash() {
        hash<string> hash1;
        hash<size_t> hash2;
        hash<size_t> finalHash;
        string toHash = to_string(data.amount) + data.receiverKey + data.senderKey + to_string(data.timestamp);
        return finalHash(hash1(toHash) + hash2(previousHash));
    }

public:
    // Constructor
    Block(int idx, TransactionData d, size_t prevHash) {
        index = idx;
        data = d;
        previousHash = prevHash;
        blockHash = generateHash();
    }

    // Get original Hash
    size_t getHash() {
        return blockHash;
    }

    // Get previous Hash
    size_t getPreviousHash() {
        return previousHash;
    }

    // Get Transaction Data
    TransactionData getData() {
        return data;
    }

    // Validate Hash
    bool isHashValid() {
        return generateHash() == blockHash;
    }
    
    // Get index
    int getIndex() {
        return index;
    }
};

// Blockchain Class
class Blockchain {
private:
    Block createGenesisBlock() {
        time_t current;
        TransactionData d;
        d.amount = 0;
        d.receiverKey = "None";
        d.senderKey = "None";
        d.timestamp = time(&current);

        hash<int> hash1;
        Block genesis(0, d, hash1(0));
        return genesis;
    }

public:
    // Public chain
    vector<Block> chain;

    // Constructor
    Blockchain() {
        Block genesis = createGenesisBlock();
        chain.push_back(genesis);
    }

    // Public functions
    void addBlock(TransactionData d) {
        int index = (int)chain.size();
        Block newBlock(index, d, getLatestBlock()->getHash());
        chain.push_back(newBlock);
    }

    bool isChainValid() {
        vector<Block>::iterator it;
        
        for (it = chain.begin(); it != chain.end(); ++it) {
            Block currentBlock = *it;
            if (!currentBlock.isHashValid()) {
                return false;
            }
            if (it != chain.begin()) {
                Block previousBlock = *(it - 1);
                if (currentBlock.getPreviousHash() != previousBlock.getHash()) {
                    return false;
                }
            }
        }
        return true;
    }

    Block* getLatestBlock() {
        return &chain.back();
    }
    
    // Get chain size
    size_t getChainSize() {
        return chain.size();
    }
    
    // Get block by index
    Block getBlock(int index) {
        if (index >= 0 && index < chain.size()) {
            return chain[index];
        }
        throw std::out_of_range("Block index out of range");
    }
};

PYBIND11_MODULE(blockchain, m) {
    m.doc() = "Blockchain module";
    
    py::class_<TransactionData>(m, "TransactionData")
        .def(py::init<>())
        .def(py::init<double, string, string, time_t>())
        .def_readwrite("amount", &TransactionData::amount)
        .def_readwrite("senderKey", &TransactionData::senderKey)
        .def_readwrite("receiverKey", &TransactionData::receiverKey)
        .def_readwrite("timestamp", &TransactionData::timestamp);
    
    py::class_<Block>(m, "Block")
        .def(py::init<int, TransactionData, size_t>())
        .def("getHash", &Block::getHash)
        .def("getPreviousHash", &Block::getPreviousHash)
        .def("getData", &Block::getData)
        .def("isHashValid", &Block::isHashValid)
        .def("getIndex", &Block::getIndex);
    
    py::class_<Blockchain>(m, "Blockchain")
        .def(py::init<>())
        .def("addBlock", &Blockchain::addBlock)
        .def("isChainValid", &Blockchain::isChainValid)
        .def("getChainSize", &Blockchain::getChainSize)
        .def("getBlock", &Blockchain::getBlock)
        .def_readwrite("chain", &Blockchain::chain);
}