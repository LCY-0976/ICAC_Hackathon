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
    vector<string> signature;  // Changed to vector<string>
    time_t timestamp;
    
    // Default constructor
    TransactionData() : amount(0), signature(), timestamp(0) {}
    
    // Parameterized constructor - fixed signature parameter
    TransactionData(double amt, vector<string> sig, time_t ts) 
        : amount(amt), signature(sig), timestamp(ts) {}
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
        
        // Convert signature vector to single string
        string sigStr;
        for (const auto& s : data.signature) {
            sigStr += s;
        }
        
        string toHash = to_string(data.amount) + sigStr + to_string(data.timestamp);
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
    size_t getHash() const {
        return blockHash;
    }

    // Get previous Hash
    size_t getPreviousHash() const {
        return previousHash;
    }

    // Get Transaction Data
    TransactionData getData() const {
        return data;
    }

    // Validate Hash
    bool isHashValid() const {
        return generateHash() == blockHash;
    }
    
    // Get index
    int getIndex() const {
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
        d.signature = {"Genesis"};  // Initialize vector with one element
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
        size_t prevHash = chain.back().getHash();  // Get hash directly
        Block newBlock(index, d, prevHash);
        chain.push_back(newBlock);
    }

    bool isChainValid() const {
        for (size_t i = 0; i < chain.size(); ++i) {
            const Block& currentBlock = chain[i];
            if (!currentBlock.isHashValid()) {
                return false;
            }
            if (i != 0) {
                const Block& previousBlock = chain[i-1];
                if (currentBlock.getPreviousHash() != previousBlock.getHash()) {
                    return false;
                }
            }
        }
        return true;
    }

    Block getLatestBlock() const {
        return chain.back();
    }
    
    // Get chain size
    size_t getChainSize() const {
        return chain.size();
    }
    
    // Get block by index
    Block getBlock(int index) const {
        if (index >= 0 && index < (int)chain.size()) {
            return chain[index];
        }
        throw out_of_range("Block index out of range");
    }
};

PYBIND11_MODULE(blockchain, m) {
    m.doc() = "Blockchain module";
    
    py::class_<TransactionData>(m, "TransactionData")
        .def(py::init<>())
        .def(py::init<double, vector<string>, time_t>())  // Fixed to use vector<string>
        .def_readwrite("amount", &TransactionData::amount)
        .def_readwrite("signature", &TransactionData::signature)
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
        .def("getLatestBlock", &Blockchain::getLatestBlock)  // Added missing binding
        .def("getChainSize", &Blockchain::getChainSize)
        .def("getBlock", &BlockChain::getBlock)
        .def_readonly("chain", &Blockchain::chain);  // Changed to readonly for safety
}