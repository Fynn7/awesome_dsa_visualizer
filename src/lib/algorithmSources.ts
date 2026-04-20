export const INSERTION_SORT_SOURCE = `from DSA import intArray, exch

def insertion_sort(arr):
    N = len(arr)
    for i in range(N):
        for j in range(i, 0, -1):
            if arr[j] < arr[j - 1]:
                exch(arr, j, j - 1)
            else:
                break


data = intArray(4)
data[0] = 7
data[1] = 3
data[2] = 5
data[3] = 2
insertion_sort(data)
`;

export const SELECTION_SORT_SOURCE = `from DSA import intArray, exch

def selection_sort(arr):
    N = len(arr)
    for i in range(N):
        min_idx = i
        for j in range(i + 1, N):
            if arr[j] < arr[min_idx]:
                min_idx = j
        exch(arr, i, min_idx)


data = intArray(4)
data[0] = 7
data[1] = 3
data[2] = 5
data[3] = 2
selection_sort(data)
`;

export const QUICK_FIND_SOURCE = `from DSA import intArray, stdReadInt, stdIsEmpty

class QuickFindUF:
    def __init__(self, n):
        self.id = intArray(n)
        for i in range(len(self.id)):
            self.id[i] = i

    def find(self, p):
        return self.id[p]

    def union(self, p, q):
        pid = self.id[p]
        qid = self.id[q]
        for i in range(len(self.id)):
            if self.id[i] == pid:
                self.id[i] = qid

    def connected(self, p, q):
        return self.find(p) == self.find(q)


n = stdReadInt()
uf = QuickFindUF(n)

while not stdIsEmpty():
    p = stdReadInt()
    q = stdReadInt()

    if not uf.connected(p, q):
        uf.union(p, q)
        print(p, q)
`;

export const QUICK_UNION_SOURCE = `from DSA import intArray, stdReadInt, stdIsEmpty

class QuickUnionUF:
    def __init__(self, n):
        self.id = intArray(n)
        for i in range(len(self.id)):
            self.id[i] = i

    def find(self, i):
        while i != self.id[i]:
            i = self.id[i]
        return i

    def union(self, p, q):
        i = self.find(p)
        j = self.find(q)
        self.id[i] = j

    def connected(self, p, q):
        return self.find(p) == self.find(q)


n = stdReadInt()
uf = QuickUnionUF(n)

while not stdIsEmpty():
    p = stdReadInt()
    q = stdReadInt()

    if not uf.connected(p, q):
        uf.union(p, q)
        print(p, q)
`;
