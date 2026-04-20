from DSA import intArray, stdReadInt, stdIsEmpty


class QuickFindUF:
    """
    Run with
    ```ps
    cmd /c "python .\src_py\uebung1.py < .\src_py\\tinyUF.txt"
    ```
    """
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
