import array, sys, time, os

class In:
	def __init__(self, filename):
		self.f = open(filename, "r")
		self.data = None
		
	def readAllInts(self):
		strData = []
		lines = self.f.readlines()
		for l in lines:
			strData += l.split()
		intData = []
		for s in strData:
			intData += [int(s)]
		return intData

	def readAll(self):
		strData = []
		lines = self.f.readlines()
		for l in lines:
			strData += l.split()
		return strData
		
	def nextInt(self):
		if self.data == None:
			self.data = self.readAll()
			self.N = 0
		
		if self.N == len(self.data):
			return None
			
		self.N += 1
		return int(self.data[self.N-1])

	def nextFloat(self):
		if self.data == None:
			self.data = self.readAll()
			self.N = 0

		if self.N == len(self.data):
			return None
			
		self.N += 1
		return float(self.data[self.N-1])


class Stopwatch:
	def __init__(self):
		self.start = time.perf_counter()
	
	def elapsedTime(self):
		return time.perf_counter() - self.start

def objArray(N):
	return [None]*N

def boolArray(N):
	return [False]*N
	
def intArray(N):
	return array.array("i", [0]*N)
	
def floatArray(N):
	return array.array("d", [0]*N)

def charArray(N):
	return array.array("B", [0]*N)

val = []
l = ""

def __readline__(retval=True):
	global val
	global l
	while val == []:
		l = sys.stdin.readline()
		val = l.split()
		if l == "": break
	if retval:
		if val != []:
			v = val[0]
			del val[0]
			return v
		else:
			return ""

def stdReadLine():
	global val
	global l
	if val == []:
		l = sys.stdin.readline()
	val = []
	return l

def stdReadString():
	return __readline__()
	
def stdReadInt():
	return int(__readline__())
	
def stdReadFloat():
	return float(__readline__())
	
def stdReadChar():
	return __readline__()

def stdIsEmpty():
	global val
	__readline__(False)
	return len(val) == 0
	
def stdReadAllStrings():
	a = []
	while not stdIsEmpty():
		a += [stdReadString()]
	return a

class File:
	def __init__(self, name, size):
		self.name = name
		self.size = size
		
	def __lt__(self, other):
		return self.name < other.name
	
	def __str__(self):
		return self.name + " (size: " + str(self.size) + " bytes)"

def readFiles(p):
	return [File(f, os.path.getsize(f)) for f in os.listdir(p) if os.path.isfile(os.path.join(p, f))]
	
	
def readFileNames(p):
	return [f for f in os.listdir(p) if os.path.isfile(os.path.join(p, f))]
	
def exch(a, i, j):
	t = a[i]
	a[i] = a[j]
	a[j] = t