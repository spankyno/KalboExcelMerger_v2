import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { DataRow, ExcelData } from './types';
import { UploadIcon, ExcelIcon, DownloadIcon, ResetIcon } from './components/icons';

// Make XLSX available from the window object loaded via CDN
declare const XLSX: any;

const MAX_FILES = 4;

const FileUploader: React.FC<{
  id: string;
  onFileChange: (file: File | null) => void;
  title: string;
  fileData: ExcelData | null;
}> = ({ id, onFileChange, title, fileData }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <div className="relative flex flex-col items-center justify-center w-full h-40 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none">
        {fileData ? (
          <div className="text-center">
            <ExcelIcon className="w-12 h-12 mx-auto text-green-500" />
            <p className="mt-2 font-medium text-slate-700 break-all">{fileData.fileName}</p>
            <p className="text-sm text-slate-500">{fileData.rows.length} filas cargadas</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
                <UploadIcon />
                <span className="font-medium text-slate-600">
                    Arrastra un archivo o{' '}
                    <span className="text-indigo-600 underline">búscalo</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">Soporta .xlsx</p>
            </div>
            <input
              id={id}
              type="file"
              accept=".xlsx"
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
            />
          </>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
    const [filesData, setFilesData] = useState<(ExcelData | null)[]>(Array(MAX_FILES).fill(null));
    const [mergedData, setMergedData] = useState<DataRow[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [comparisonCol, setComparisonCol] = useState<string>('');
    const [measureCols, setMeasureCols] = useState<string[]>(Array(MAX_FILES).fill(''));
    const [outputCols, setOutputCols] = useState<Record<string, boolean>>({});
    
    const loadedFiles = useMemo(() => filesData.filter((f): f is ExcelData => f !== null), [filesData]);

    const commonHeaders = useMemo(() => {
        if (loadedFiles.length < 2) return [];
        let common = new Set(loadedFiles[0].headers);
        for (let i = 1; i < loadedFiles.length; i++) {
            const currentHeaders = new Set(loadedFiles[i].headers);
            common = new Set([...common].filter(header => currentHeaders.has(header)));
        }
        return Array.from(common);
    }, [loadedFiles]);

    const allHeaders = useMemo(() => {
        const all = new Set<string>();
        loadedFiles.forEach(file => {
            file.headers.forEach(header => all.add(header));
        });
        return Array.from(all);
    }, [loadedFiles]);

    const handleFileChange = useCallback(async (file: File | null, index: number) => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: DataRow[] = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                throw new Error('El archivo Excel está vacío o tiene un formato incorrecto.');
            }

            const headers = Object.keys(jsonData[0]);
            const excelData = { fileName: file.name, headers, rows: jsonData };

            setFilesData(prev => {
                const newFiles = [...prev];
                newFiles[index] = excelData;
                return newFiles;
            });

        } catch (err) {
            console.error(err);
            setError(`Error al procesar el archivo ${file.name}. Asegúrate de que es un archivo .xlsx válido.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setFilesData(Array(MAX_FILES).fill(null));
        setMeasureCols(Array(MAX_FILES).fill(''));
        setMergedData([]);
        setError('');
        setIsLoading(false);
        setComparisonCol('');
        setOutputCols({});
        for (let i = 0; i < MAX_FILES; i++) {
            const input = document.getElementById(`file${i}`) as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const handleMerge = () => {
        const activeFiles = filesData.map((file, index) => ({ file, index }))
                                     .filter(item => item.file !== null);
        
        if (activeFiles.length < 2 || !comparisonCol || measureCols.some((col, index) => filesData[index] && !col)) {
            setError('Por favor, carga al menos dos archivos y completa toda la configuración.');
            return;
        }

        setIsLoading(true);
        setError('');

        const mergedMap = new Map<any, DataRow>();
        
        const allPossibleMeasureNames = filesData.map((f, i) => f ? `${measureCols[i]}_${i+1}` : null).filter(Boolean) as string[];

        activeFiles.forEach(({ file, index }) => {
            const measureCol = measureCols[index];
            const newMeasureColName = `${measureCol}_${index + 1}`;

            file!.rows.forEach(row => {
                const key = row[comparisonCol];
                if (key === undefined) return;

                const existingRow = mergedMap.get(key);

                if (existingRow) {
                    existingRow[newMeasureColName] = row[measureCol];
                    Object.keys(row).forEach(header => {
                        if (!existingRow.hasOwnProperty(header)) {
                            existingRow[header] = row[header];
                        }
                    });
                } else {
                    const newRow = { ...row };
                    delete newRow[measureCol];
                    
                    allPossibleMeasureNames.forEach(name => {
                        newRow[name] = null;
                    });
                    
                    newRow[newMeasureColName] = row[measureCol];
                    
                    mergedMap.set(key, newRow);
                }
            });
        });
        
        const finalData = Array.from(mergedMap.values());
        
        const finalHeaders = new Set<string>();
        Object.keys(outputCols).forEach(col => {
            if (!outputCols[col]) return; 
            
            let isMeasureCol = false;
            filesData.forEach((file, index) => {
                if(file && measureCols[index] === col) {
                    isMeasureCol = true;
                    finalHeaders.add(`${col}_${index + 1}`);
                }
            });

            if (!isMeasureCol) {
                finalHeaders.add(col);
            }
        });

        const filteredFinalData = finalData.map(row => {
            const filteredRow: DataRow = {};
            finalHeaders.forEach(header => {
                filteredRow[header] = row.hasOwnProperty(header) ? row[header] : null;
            });
            return filteredRow;
        });

        setMergedData(filteredFinalData);
        setIsLoading(false);
    };
    
    const handleDownload = () => {
        if (mergedData.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(mergedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fusionado");
        XLSX.writeFile(workbook, "ListaFusionada.xlsx");
    };

    const handleOutputColChange = (header: string, isChecked: boolean) => {
        setOutputCols(prev => ({ ...prev, [header]: isChecked }));
    };

    useEffect(() => {
        if (commonHeaders.length > 0 && !comparisonCol) {
            setComparisonCol(commonHeaders[0]);
        }

        const newMeasureCols = [...measureCols];
        let changed = false;
        filesData.forEach((file, index) => {
            if (file && !newMeasureCols[index] && file.headers.length > 0) {
                newMeasureCols[index] = file.headers[0];
                changed = true;
            }
        });
        if (changed) {
            setMeasureCols(newMeasureCols);
        }

        if (allHeaders.length > 0 && Object.keys(outputCols).length === 0) {
            const initialCols = allHeaders.reduce((acc, header) => {
                acc[header] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setOutputCols(initialCols);
        }
    }, [filesData, commonHeaders, allHeaders, comparisonCol, measureCols, outputCols]);


    const renderConfig = () => {
        if (loadedFiles.length < 2) return null;
        return (
            <div className="w-full mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200">
                <h2 className="text-xl font-bold mb-4 text-slate-800">2. Configurar Fusión</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label htmlFor="comparisonCol" className="block text-sm font-medium text-slate-700 mb-1">Columna de Comparación</label>
                        <select id="comparisonCol" value={comparisonCol} onChange={e => setComparisonCol(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            {commonHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                     {filesData.map((fileData, index) => fileData && (
                        <div key={index}>
                            <label htmlFor={`measureCol${index}`} className="block text-sm font-medium text-slate-700 mb-1">{`Medición (Archivo ${index + 1})`}</label>
                            <select 
                                id={`measureCol${index}`} 
                                value={measureCols[index]} 
                                onChange={e => {
                                    const newMeasureCols = [...measureCols];
                                    newMeasureCols[index] = e.target.value;
                                    setMeasureCols(newMeasureCols);
                                }} 
                                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {fileData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    ))}
                </div>

                <div>
                    <h3 className="text-md font-medium text-slate-700 mb-2">Columnas para incluir en el resultado:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded border">
                        {allHeaders.map(header => (
                            <div key={header} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`col-${header}`}
                                    checked={outputCols[header] || false}
                                    onChange={e => handleOutputColChange(header, e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={`col-${header}`} className="ml-2 block text-sm text-slate-800 truncate" title={header}>{header}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                     <button onClick={handleMerge} disabled={isLoading} className="px-6 py-2 text-white font-semibold bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        {isLoading ? 'Fusionando...' : 'Fusionar Listas'}
                    </button>
                </div>
            </div>
        );
    };
    
    const renderResults = () => {
        if (mergedData.length === 0) return null;
        const headers = Object.keys(mergedData[0] || {});
        return (
            <div className="w-full mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">3. Resultado de la Fusión</h2>
                    <button onClick={handleDownload} className="inline-flex items-center px-4 py-2 text-white font-semibold bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <DownloadIcon />
                        Descargar Excel
                    </button>
                </div>
                <div className="overflow-x-auto max-h-96 border rounded-lg">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                {headers.map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                           {mergedData.slice(0, 100).map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-slate-50">
                                    {headers.map(header => (
                                        <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{String(row[header] === null ? '' : row[header])}</td>
                                    ))}
                                </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
                {mergedData.length > 100 && <p className="text-center text-sm text-slate-500 mt-2">Mostrando las primeras 100 filas de {mergedData.length}. El archivo descargado contendrá todos los datos.</p>}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kalbo Excel Merger</h1>
                    <p className="mt-2 text-lg text-slate-600">Combina hasta 4 archivos Excel de forma inteligente.</p>
                </header>
                
                 <div className="flex justify-end mb-4">
                    <button onClick={handleReset} className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <ResetIcon />
                        Empezar de Nuevo
                    </button>
                </div>

                <div className="w-full p-6 bg-white rounded-lg shadow-md border border-slate-200">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">1. Cargar Archivos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({ length: MAX_FILES }).map((_, index) => (
                             <FileUploader
                                key={index}
                                id={`file${index}`}
                                title={`Archivo ${index + 1}`}
                                onFileChange={(file) => handleFileChange(file, index)}
                                fileData={filesData[index]}
                            />
                        ))}
                    </div>
                </div>

                {error && <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}

                {renderConfig()}
                
                {renderResults()}

            </div>
        </div>
    );
};

export default App;
