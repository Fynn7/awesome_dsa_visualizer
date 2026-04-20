from DSA import intArray, stdReadInt, stdIsEmpty


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
